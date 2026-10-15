/** Tipos y utilidades de los hitos (timeline) de la ficha de laboratorio. */

export type LabMilestoneKind = 'detail' | 'terminal' | 'comparison' | 'metrics';

export interface LabMilestone {
  id: string;
  title: string;
  summary: string;
  kind: LabMilestoneKind;
  /** Detalle del hito en Markdown (se muestra en el panel derecho). */
  content: string;
}

export const LAB_MILESTONE_KINDS: LabMilestoneKind[] = [
  'detail',
  'terminal',
  'comparison',
  'metrics',
];

export const LAB_MILESTONE_KIND_LABELS: Record<LabMilestoneKind, string> = {
  detail: 'Detalle',
  terminal: 'Terminal / logs',
  comparison: 'Hipótesis vs Realidad',
  metrics: 'Métricas (HUD)',
};

export function newMilestoneId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Normaliza un valor cualquiera (JSON del API) a un array de hitos seguro. */
export function normalizeMilestones(value: unknown): LabMilestone[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null)
    .map((m) => {
      const kind = LAB_MILESTONE_KINDS.includes(m.kind as LabMilestoneKind)
        ? (m.kind as LabMilestoneKind)
        : 'detail';
      return {
        id: typeof m.id === 'string' && m.id ? m.id : newMilestoneId(),
        title: typeof m.title === 'string' ? m.title : '',
        summary: typeof m.summary === 'string' ? m.summary : '',
        kind,
        content: typeof m.content === 'string' ? m.content : '',
      };
    })
    .filter((m) => m.title || m.summary || m.content);
}
