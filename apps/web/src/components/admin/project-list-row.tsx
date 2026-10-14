'use client';

import Image from 'next/image';
import { ArrowDown, ArrowUp, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminListCard } from '@/components/admin/admin-list-card';
import { PROJECT_STATUS_LABELS } from '@/components/admin/project-status';
import type { ApiProject } from '@/lib/api/client';

const MOVE_BUTTON =
  'flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

interface ProjectListRowProps {
  project: ApiProject;
  /** Posición real del proyecto en el listado completo (el número de la izquierda). */
  position: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Mientras el API reordena, las flechas quedan bloqueadas. */
  reordering?: boolean;
  onMove: (delta: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Fila del listado de proyectos del panel.
 *
 * La usan la pestaña «Proyectos» y la vista «Proyectos por clasificación» de
 * «Clasificación»: así las dos ofrecen EXACTAMENTE las mismas acciones (subir,
 * bajar, editar en la vista superpuesta y eliminar) sobre el mismo diseño.
 */
export function ProjectListRow({
  project,
  position,
  canMoveUp,
  canMoveDown,
  reordering = false,
  onMove,
  onEdit,
  onDelete,
}: ProjectListRowProps) {
  const categoryName = project.projectCategory?.name ?? project.category ?? null;

  return (
    <AdminListCard
      leading={
        project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            width={112}
            height={64}
            className="h-14 w-24 rounded-md border border-border object-cover sm:h-16 sm:w-28"
            unoptimized
          />
        ) : null
      }
      title={
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {String(position).padStart(2, '0')}
          </span>
          <span className="min-w-0">{project.title}</span>
        </span>
      }
      badges={
        <>
          <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
          {project.featured && (
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              Destacado
            </span>
          )}
          {categoryName && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              <FolderKanban className="h-3 w-3" /> {categoryName}
            </span>
          )}
        </>
      }
      meta={project.description ? <p className="line-clamp-2">{project.description}</p> : null}
      actions={
        <>
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={!canMoveUp || reordering}
            className={MOVE_BUTTON}
            aria-label={`Mover ${project.title} antes`}
            title="Mover antes"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={!canMoveDown || reordering}
            className={MOVE_BUTTON}
            aria-label={`Mover ${project.title} después`}
            title="Mover después"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-400">
            <Trash2 className="h-4 w-4" /> Quitar
          </Button>
        </>
      }
    />
  );
}
