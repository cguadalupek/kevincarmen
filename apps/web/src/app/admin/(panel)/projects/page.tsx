'use client';

import { useCallback, useEffect, useState } from 'react';
import { FolderKanban, FolderTree, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminSubNav } from '@/components/admin/admin-subnav';
import { ProjectEditorModal } from '@/components/admin/project-editor';
import { ProjectListRow } from '@/components/admin/project-list-row';
import { api, type ApiProject, type ApiProjectCategory } from '@/lib/api/client';

/** Mueve el elemento `index` una posición arriba/abajo; `null` si se sale de la lista. */
function move<T>(list: T[], index: number, delta: -1 | 1): T[] | null {
  const target = index + delta;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [categories, setCategories] = useState<ApiProjectCategory[]>([]);
  /**
   * Editor en vista superpuesta (`ProjectEditorModal`): `undefined` = cerrado,
   * `null` = proyecto nuevo, un proyecto = edición del existente.
   */
  const [editor, setEditor] = useState<ApiProject | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getProjects(), api.getProjectCategories()])
      .then(([projectList, categoryList]) => {
        setProjects(projectList);
        setCategories(categoryList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar proyectos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(item: ApiProject) {
    if (!window.confirm(`¿Eliminar el proyecto "${item.title}"?`)) return;
    try {
      await api.deleteProject(item.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    }
  }

  /**
   * Reordenar con las flechas ↑↓: se manda el array COMPLETO ya intercambiado y el API
   * renumera (`position` 10, 20, 30…). El mismo orden es el que ve el visitante en
   * /proyectos y el que decide qué destacados entran primero en la portada.
   */
  async function moveProject(index: number, delta: -1 | 1) {
    const next = move(projects, index, delta);
    if (!next) return;
    setReordering(true);
    setError('');
    try {
      setProjects(await api.reorderProjects(next.map((project) => project.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al reordenar');
    } finally {
      setReordering(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Proyectos"
        subtitle="Casos de estudio técnicos profesionales."
        action={
          <Button variant="accent" onClick={() => setEditor(null)} disabled={editor !== undefined}>
            <Plus className="h-4 w-4" /> Nuevo proyecto
          </Button>
        }
      />

      <AdminSubNav
        ariaLabel="Subsecciones de proyectos"
        items={[
          {
            key: 'proyectos',
            label: 'Proyectos',
            icon: <FolderKanban className="h-4 w-4 shrink-0" />,
            href: '/admin/projects',
            active: true,
            badge: projects.length,
          },
          {
            key: 'clasificacion',
            label: 'Clasificación',
            icon: <FolderTree className="h-4 w-4 shrink-0" />,
            href: '/admin/projects/clasificacion',
            badge: categories.length,
          },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* El alta y la edición se hacen en la vista superpuesta: la lista de abajo
          no se toca y no hay que subir con el scroll para editar el último proyecto. */}
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

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          Aún no hay proyectos. Crea el primero con «Nuevo proyecto».
        </div>
      ) : (
        <div className="space-y-3">
          {reordering && (
            <p className="text-xs text-muted-foreground">Guardando el nuevo orden…</p>
          )}
          {projects.map((item, index) => (
            <ProjectListRow
              key={item.id}
              project={item}
              position={index + 1}
              canMoveUp={index > 0}
              canMoveDown={index < projects.length - 1}
              reordering={reordering}
              onMove={(delta) => moveProject(index, delta)}
              onEdit={() => setEditor(item)}
              onDelete={() => remove(item)}
            />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 text-foreground">
          <FolderTree className="h-3.5 w-3.5" /> Cómo funciona el orden
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Las flechas ↑ ↓ reordenan el listado y ese mismo orden es el del sitio público
            (/proyectos) y el de la sección «Proyectos destacados» de la portada.
          </li>
          <li>
            El número de la izquierda de cada fila es su posición real. Se renumera en múltiplos
            de 10 para poder insertar entre dos sin tocar el resto.
          </li>
          <li>
            «Destacado» decide si el proyecto entra en la portada (hasta 6, los primeros de la
            lista).
          </li>
          <li>
            Las clasificaciones («Software», «Web»…) ya no son fijas: se crean, renombran y
            reordenan en la subsección «Clasificación»; renombrar una actualiza los proyectos que
            la usan.
          </li>
          <li>
            «Editar» abre el proyecto en una ventana superpuesta, sin perder de vista el listado.
          </li>
        </ul>
      </div>
    </>
  );
}
