'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  FileCode,
  FolderArchive,
  Plus,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminListCard } from '@/components/admin/admin-list-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminSubNav } from '@/components/admin/admin-subnav';
import { api, type ApiResourceTypeItem } from '@/lib/api/client';
import { RESOURCE_ICON_OPTIONS, resourceIcon } from '@/lib/resource-icons';

const FIELD =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50';

// "Guía / PDF" → "guia-pdf" (misma regla que el backend).
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

interface TypeFormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  /** Posición como texto (`''` = el API la pone al final). */
  position: string;
}

const EMPTY_FORM: TypeFormState = {
  name: '',
  slug: '',
  description: '',
  icon: 'file-code',
  position: '',
};

/**
 * Subsección «Tipos» de Recursos: los tipos («Script», «Plantilla»…) dejaron de ser una
 * lista fija en el código y son filas de tabla que se crean, renombran, reordenan y
 * eliminan aquí, igual que las clasificaciones de proyectos. El desplegable «Tipo» del
 * formulario de recursos y el filtro de /recursos se llenan con esta tabla.
 */
export default function AdminResourceTypesPage() {
  const [types, setTypes] = useState<ApiResourceTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiResourceTypeItem | null>(null);
  const [form, setForm] = useState<TypeFormState>(EMPTY_FORM);

  const load = useCallback(() => {
    setBusy(true);
    api
      .getResourceTypes()
      .then(setTypes)
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

  function openEdit(type: ApiResourceTypeItem) {
    setError('');
    setEditing(type);
    setForm({
      name: type.name,
      slug: type.slug,
      description: type.description ?? '',
      icon: type.icon,
      position: String(type.position ?? 0),
    });
    setShowForm(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
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
        icon: form.icon,
        position: toPosition(form.position),
      };
      if (editing) await api.updateResourceType(editing.id, payload);
      else await api.createResourceType(payload);
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  async function remove(type: ApiResourceTypeItem) {
    if (
      !window.confirm(
        `¿Eliminar el tipo "${type.name}"? Los recursos que lo usan deben tener otro.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.deleteResourceType(type.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Reordenar con las flechas ↑↓: se manda el array completo ya intercambiado y el API
   * renumera (10, 20, 30…). Ese orden es el del filtro «Tipo» de /recursos.
   */
  async function moveType(index: number, delta: -1 | 1) {
    const next = move(types, index, delta);
    if (!next) return;
    setBusy(true);
    setError('');
    try {
      setTypes(await api.reorderResourceTypes(next.map((type) => type.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reordenar');
    } finally {
      setBusy(false);
    }
  }

  const PreviewIcon = resourceIcon(form.icon);

  return (
    <>
      <AdminPageHeader
        title="Tipos de recurso"
        subtitle="Los tipos del campo «Tipo» de los recursos. Se reflejan al instante en el formulario y en el filtro de /recursos."
        backHref="/admin/recursos"
        backLabel="Recursos"
      />

      <AdminSubNav
        ariaLabel="Subsecciones de recursos"
        items={[
          {
            key: 'recursos',
            label: 'Recursos',
            icon: <FolderArchive className="h-4 w-4 shrink-0" />,
            href: '/admin/recursos',
          },
          {
            key: 'tipos',
            label: 'Tipos',
            icon: <FileCode className="h-4 w-4 shrink-0" />,
            href: '/admin/recursos/tipos',
            active: true,
            badge: types.length,
          },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold sm:text-lg">Tipos de recurso</h2>
        <Button type="button" variant="accent" onClick={openNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nuevo tipo
        </Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="glass-card mb-8 space-y-4 p-5">
          <h3 className="font-semibold">
            {editing ? `Editar "${editing.name}"` : 'Nuevo tipo de recurso'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo-nombre" className="mb-1 block text-sm font-medium">
                Nombre
              </label>
              <input
                id="tipo-nombre"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    // Auto-slug mientras no se haya tocado el slug a mano.
                    slug: form.slug === toSlug(form.name) ? toSlug(e.target.value) : form.slug,
                  })
                }
                placeholder="Plantilla"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="tipo-slug" className="mb-1 block text-sm font-medium">
                Slug (URL)
              </label>
              <input
                id="tipo-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="plantilla"
                className={`${FIELD} font-mono`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="tipo-descripcion" className="mb-1 block text-sm font-medium">
              Descripción (opcional)
            </label>
            <textarea
              id="tipo-descripcion"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={`${FIELD} resize-none`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo-icono" className="mb-1 block text-sm font-medium">
                Icono en el sitio
              </label>
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <PreviewIcon className="h-5 w-5 text-accent" />
                </span>
                <select
                  id="tipo-icono"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className={FIELD}
                >
                  {RESOURCE_ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="tipo-orden" className="mb-1 block text-sm font-medium">
                Orden en el filtro
              </label>
              <input
                id="tipo-orden"
                type="number"
                min={0}
                step={10}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Vacío = al final"
                className={FIELD}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Menor número = primero. También puedes usar las flechas ↑ ↓.
              </p>
            </div>
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
              <Check className="h-4 w-4" /> {editing ? 'Guardar cambios' : 'Crear tipo'}
            </Button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      <div className="space-y-3">
        {!loading && types.length === 0 && (
          <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            Aún no hay tipos. Crea el primero con «Nuevo tipo».
          </div>
        )}

        {types.map((type, index) => {
          const Icon = resourceIcon(type.icon);
          return (
            <AdminListCard
              key={type.id}
              leading={
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted sm:h-16 sm:w-16">
                  <Icon className="h-5 w-5 text-accent" />
                </span>
              }
              title={
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">{type.name}</span>
                </span>
              }
              badges={
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  /{type.slug}
                </span>
              }
              meta={
                <>
                  {type.description ? <p className="line-clamp-2">{type.description}</p> : null}
                  <p>
                    {type.resourcesCount} recurso{type.resourcesCount === 1 ? '' : 's'}
                  </p>
                </>
              }
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => moveType(index, -1)}
                    disabled={index === 0 || busy}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Mover ${type.name} antes`}
                    title="Mover antes"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveType(index, 1)}
                    disabled={index === types.length - 1 || busy}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Mover ${type.name} después`}
                    title="Mover después"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(type)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent"
                    aria-label={`Editar ${type.name}`}
                    title="Editar"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(type)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-red-400"
                    aria-label={`Eliminar ${type.name}`}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              }
            />
          );
        })}
      </div>

      <div className="mt-10 rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 text-foreground">
          <Tags className="h-3.5 w-3.5" /> Notas
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            El desplegable «Tipo» del formulario de recursos y el filtro «Tipo» de /recursos se
            llenan con estos tipos: al crear uno aparece al instante.
          </li>
          <li>
            Un tipo usado por recursos no se puede eliminar hasta que esos recursos tengan otro
            (evita dejar descargas sin clasificar).
          </li>
          <li>
            El orden lo mandan las flechas ↑ ↓ o el campo «Orden» (menor número = primero). Sólo
            aparecen en el filtro del sitio los tipos que tienen recursos publicados.
          </li>
          <li>
            El icono se elige aquí: es el que se pinta en las tarjetas de /recursos y en este
            listado.
          </li>
        </ul>
      </div>
    </>
  );
}
