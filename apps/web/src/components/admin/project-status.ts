/**
 * Estados de un proyecto del CMS: etiqueta legible + orden del desplegable.
 *
 * `ACTIVE` es legado (proyectos antiguos): se traduce pero no se ofrece al crear
 * ni al editar, por eso el formulario filtra esa clave.
 */
export const PROJECT_STATUS_LABELS = {
  IN_PROGRESS: 'En desarrollo',
  COMPLETED: 'Completado',
  ARCHIVED: 'Archivado',
  ACTIVE: 'Activo',
} as const;

export type ProjectStatusKey = keyof typeof PROJECT_STATUS_LABELS;

/** Estados que se pueden elegir en el formulario (sin el legado `ACTIVE`). */
export const PROJECT_STATUS_OPTIONS = (
  Object.keys(PROJECT_STATUS_LABELS) as ProjectStatusKey[]
).filter((key) => key !== 'ACTIVE');
