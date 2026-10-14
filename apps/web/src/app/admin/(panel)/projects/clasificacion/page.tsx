'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { api, type ApiProjectCategory } from '@/lib/api/client';

const FIELD =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50';

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
 * Subsección «Clasificación» de Proyectos: las clasificaciones («Software», «Web»…)
 * dejaron de ser valores fijos del formulario y son filas de tabla que se crean,
 * renombran y reordenan aquí — igual que las categorías de los artículos.
 */
export default function AdminProjectCategoriesPage() {
  const [categories, setCategories] = useState<ApiProjectCategory[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiProjectCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const load = useCallback(() => {
    setBusy(true);
    api
      .getProjectCategories()
      .then(setCategories)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'))
      .finally(() => {
        setBusy(false);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

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
                {category.description ? <p className="line-clamp-2">{category.description}</p> : null}
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
        </ul>
      </div>
    </>
  );
}
