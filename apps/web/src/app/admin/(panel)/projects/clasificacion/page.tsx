'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  FolderKanban,
  FolderTree,
  Plus,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminListCard } from '@/components/admin/admin-list-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminSubNav } from '@/components/admin/admin-subnav';
import { ProjectEditorModal } from '@/components/admin/project-editor';
import { ProjectListRow } from '@/components/admin/project-list-row';
import { api, type ApiProject, type ApiProjectCategory } from '@/lib/api/client';

const FIELD =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50';

/** «Todas las clasificaciones» y «sin clasificar» en el filtro de la vista. */
const ALL = 'all';
const NONE = 'none';

// "Redes & Seguridad" → "redes-seguridad" (misma regla que el backend).
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  /** Posición como texto (`''` = el API la pone al final). */
  position: string;
}

const EMPTY_FORM: CategoryFormState = { name: '', slug: '', description: '', position: '' };

function toPosition(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : undefined;
}

/** Mueve el elemento `index` una posición arriba/abajo; `null` si se sale de la lista. */
function move<T>(list: T[], index: number, delta: -1 | 1): T[] | null {
  const target = index + delta;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Subsección «Clasificación» de Proyectos.
 *
 * Tiene dos vistas:
 * - «Clasificaciones»: las clasificaciones («Software», «Web»…) dejaron de ser valores
 *   fijos del formulario y son filas de tabla que se crean, renombran y reordenan aquí
 *   — igual que las categorías de los artículos. Cada ficha muestra cuántos proyectos la usan.
 * - «Proyectos por clasificación»: el conteo limpio de los proyectos filtrados (un solo
 *   número) y las mismas filas de la pestaña «Proyectos» —subir, bajar, editar en la vista
 *   superpuesta y eliminar— para gestionarlos sin salir de su clasificación.
 */
export default function AdminProjectCategoriesPage() {
  const [categories, setCategories] = useState<ApiProjectCategory[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'clasificaciones' | 'proyectos'>('clasificaciones');
  /** Clasificación filtrada en la vista de proyectos: `ALL`, `NONE` o el id. */
  const [filterId, setFilterId] = useState<string>(ALL);
  /** `undefined` = editor cerrado, `null` = proyecto nuevo, un proyecto = edición. */
  const [editor, setEditor] = useState<ApiProject | null | undefined>(undefined);
  const [reordering, setReordering] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiProjectCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const load = useCallback(() => {
    setBusy(true);
    Promise.all([api.getProjectCategories(), api.getProjects()])
      .then(([categoryList, projectList]) => {
        setCategories(categoryList);
        setProjects(projectList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'))
      .finally(() => {
        setBusy(false);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ───────────── clasificaciones (vista 1) ───────────── */

  function openNew() {
    setError('');
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(category: ApiProjectCategory) {
    setError('');
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      position: String(category.position ?? 0),
    });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        position: toPosition(form.position),
      };
      if (editing) await api.updateProjectCategory(editing.id, payload);
      else await api.createProjectCategory(payload);
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: ApiProjectCategory) {
    if (
      !window.confirm(
        `¿Eliminar la clasificación "${category.name}"? Los proyectos que la usan deben tener otra.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.deleteProjectCategory(category.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Reordenar con las flechas ↑↓: se manda el array completo ya intercambiado y el API
   * renumera (10, 20, 30…). Ese orden es el del desplegable de filtros de /proyectos.
   */
  async function moveCategory(index: number, delta: -1 | 1) {
    const next = move(categories, index, delta);
    if (!next) return;
    setBusy(true);
    setError('');
    try {
      setCategories(await api.reorderProjectCategories(next.map((category) => category.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reordenar');
    } finally {
      setBusy(false);
    }
  }

  /* ───────────── proyectos por clasificación (vista 2) ───────────── */

  /** Cuántos proyectos usa cada clasificación (y cuántos no tienen ninguna). */
  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const project of projects) {
      const key = project.projectCategory?.id ?? NONE;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (filterId === ALL) return projects;
    if (filterId === NONE) return projects.filter((project) => !project.projectCategory);
    return projects.filter((project) => project.projectCategory?.id === filterId);
  }, [projects, filterId]);

  const activeCategory = categories.find((category) => category.id === filterId) ?? null;
  const unclassified = countByCategory.get(NONE) ?? 0;

  /**
   * Las flechas ↑↓ de la vista filtrada intercambian el proyecto con el vecino de SU
   * clasificación y se manda el array completo (el API renumera), así que el orden del
   * sitio y el de la portada siguen siendo el mismo que ve la pestaña «Proyectos».
   */
  async function moveProject(project: ApiProject, delta: -1 | 1) {
    const index = filteredProjects.findIndex((item) => item.id === project.id);
    const neighbour = filteredProjects[index + delta];
    if (!neighbour) return;
    const from = projects.findIndex((item) => item.id === project.id);
    const to = projects.findIndex((item) => item.id === neighbour.id);
    if (from < 0 || to < 0) return;
    const next = [...projects];
    [next[from], next[to]] = [next[to], next[from]];
    setReordering(true);
    setError('');
    try {
      setProjects(await api.reorderProjects(next.map((item) => item.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reordenar');
    } finally {
      setReordering(false);
    }
  }

  async function removeProject(project: ApiProject) {
    if (!window.confirm(`¿Eliminar el proyecto "${project.title}"?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.deleteProject(project.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setBusy(false);
    }
  }

  /** Ficha del filtro: nombre + cuántos proyectos tiene. */
  function filterChip(key: string, label: string, count: number) {
    const active = filterId === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setFilterId(key)}
        aria-pressed={active}
        className={
          active
            ? 'inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent'
            : 'inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground'
        }
      >
        {label}
        <span className="font-mono text-xs opacity-70">{count}</span>
      </button>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Clasificación"
        subtitle="Crea y organiza las clasificaciones de tus proyectos. Se reflejan al instante en el filtro de la sección Proyectos del sitio."
        backHref="/admin/projects"
        backLabel="Proyectos"
      />

      <AdminSubNav
        ariaLabel="Subsecciones de proyectos"
        items={[
          {
            key: 'proyectos',
            label: 'Proyectos',
            icon: <FolderKanban className="h-4 w-4 shrink-0" />,
            href: '/admin/projects',
          },
          {
            key: 'clasificacion',
            label: 'Clasificación',
            icon: <FolderTree className="h-4 w-4 shrink-0" />,
            href: '/admin/projects/clasificacion',
            active: true,
            badge: categories.length,
          },
        ]}
      />

      <AdminSubNav
        ariaLabel="Vistas de clasificación"
        items={[
          {
            key: 'clasificaciones',
            label: 'Clasificaciones',
            icon: <FolderTree className="h-4 w-4 shrink-0" />,
            active: view === 'clasificaciones',
            badge: categories.length,
            onClick: () => setView('clasificaciones'),
          },
          {
            key: 'proyectos',
            label: 'Proyectos por clasificación',
            icon: <FolderKanban className="h-4 w-4 shrink-0" />,
            active: view === 'proyectos',
            badge: projects.length,
            onClick: () => setView('proyectos'),
          },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Alta y edición de proyectos: misma vista superpuesta que la pestaña «Proyectos». */}
      {editor !== undefined && (
        <ProjectEditorModal
          project={editor}
          categories={categories}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            load();
          }}
        />
      )}

      {view === 'clasificaciones' ? (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold sm:text-lg">Clasificaciones de proyectos</h2>
            <Button type="button" variant="accent" onClick={openNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Nueva clasificación
            </Button>
          </div>

          {showForm && (
            <form onSubmit={save} className="glass-card mb-8 space-y-4 p-5">
              <h3 className="font-semibold">
                {editing ? `Editar "${editing.name}"` : 'Nueva clasificación'}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nombre</label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        // Auto-slug mientras no se haya tocado el slug a mano.
                        slug: form.slug === toSlug(form.name) ? toSlug(e.target.value) : form.slug,
                      })
                    }
                    placeholder="Infraestructura"
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Slug (URL)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="infraestructura"
                    className={`${FIELD} font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Descripción (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className={`${FIELD} resize-none`}
                />
              </div>
              <div className="sm:max-w-xs">
                <label htmlFor="clasificacion-orden" className="mb-1 block text-sm font-medium">
                  Orden en el filtro
                </label>
                <input
                  id="clasificacion-orden"
                  type="number"
                  min={0}
                  step={10}
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Vacío = al final"
                  className={FIELD}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Menor número = primero en el desplegable. También puedes usar las flechas ↑ ↓.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setError('');
                  }}
                >
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button type="submit" variant="accent" disabled={busy}>
                  <Check className="h-4 w-4" /> {editing ? 'Guardar cambios' : 'Crear clasificación'}
                </Button>
              </div>
            </form>
          )}

          {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

          <div className="space-y-3">
            {!loading && categories.length === 0 && (
              <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
                Aún no hay clasificaciones. Crea la primera con «Nueva clasificación».
              </div>
            )}

            {categories.map((category, index) => (
              <AdminListCard
                key={category.id}
                title={
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">{category.name}</span>
                  </span>
                }
                badges={
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    /{category.slug}
                  </span>
                }
                meta={
                  <>
                    {category.description ? (
                      <p className="line-clamp-2">{category.description}</p>
                    ) : null}
                    <p>
                      {category.projectsCount} proyecto{category.projectsCount === 1 ? '' : 's'}
                    </p>
                  </>
                }
                actions={
                  <>
                    <button
                      type="button"
                      onClick={() => moveCategory(index, -1)}
                      disabled={index === 0 || busy}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label={`Mover ${category.name} antes`}
                      title="Mover antes"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(index, 1)}
                      disabled={index === categories.length - 1 || busy}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label={`Mover ${category.name} después`}
                      title="Mover después"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent"
                      aria-label={`Editar ${category.name}`}
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(category)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-red-400"
                      aria-label={`Eliminar ${category.name}`}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                }
              />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Filtro por clasificación */}
          <div className="mb-5 flex flex-wrap gap-2">
            {filterChip(ALL, 'Todas', projects.length)}
            {categories.map((category) =>
              filterChip(category.id, category.name, countByCategory.get(category.id) ?? 0),
            )}
            {unclassified > 0 && filterChip(NONE, 'Sin clasificar', unclassified)}
          </div>

          {/*
            Conteo limpio: la vista muestra ÚNICAMENTE la cantidad total de los
            proyectos filtrados (sin listados ni fichas alrededor).
          */}
          <div className="glass-card mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">
                {activeCategory
                  ? `Proyectos en «${activeCategory.name}»`
                  : filterId === NONE
                    ? 'Proyectos sin clasificación'
                    : 'Proyectos clasificados y sin clasificar'}
              </p>
              <p className="mt-1 text-3xl font-semibold leading-none text-accent">
                {filteredProjects.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredProjects.length === 1 ? 'proyecto' : 'proyectos'} de {projects.length} en
                total
              </p>
            </div>
            <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">
              Cada fila tiene las mismas acciones que en la pestaña «Proyectos»: subir, bajar,
              editar en la ventana superpuesta y eliminar.
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
              No hay proyectos en esta clasificación todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {reordering && (
                <p className="text-xs text-muted-foreground">Guardando el nuevo orden…</p>
              )}
              {filteredProjects.map((project, index) => (
                <ProjectListRow
                  key={project.id}
                  project={project}
                  position={projects.findIndex((item) => item.id === project.id) + 1}
                  canMoveUp={index > 0}
                  canMoveDown={index < filteredProjects.length - 1}
                  reordering={reordering || busy}
                  onMove={(delta) => moveProject(project, delta)}
                  onEdit={() => setEditor(project)}
                  onDelete={() => removeProject(project)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-10 rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 text-foreground">
          <Tags className="h-3.5 w-3.5" /> Notas
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Al renombrar una clasificación se actualizan los proyectos que la usan (el nombre
            nuevo se ve al instante en las tarjetas y en el listado).
          </li>
          <li>
            Una clasificación usada por proyectos no se puede eliminar hasta que esos proyectos
            tengan otra (evita dejar contenido sin clasificar).
          </li>
          <li>
            El orden lo mandan las flechas ↑ ↓ o el campo «Orden» (menor número = primero). Es el
            orden del desplegable de /proyectos.
          </li>
          <li>Sólo aparecen en el filtro del sitio las clasificaciones que tienen proyectos.</li>
          <li>
            La vista «Proyectos por clasificación» filtra con las fichas de arriba, muestra el
            total filtrado y deja gestionar cada proyecto (subir, bajar, editar y eliminar) sin
            salir de su clasificación.
          </li>
        </ul>
      </div>
    </>
  );
}
