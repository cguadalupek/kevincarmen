/**
 * Telemetría de likes: puente entre el servicio y el nodo remoto.
 *
 * `recordLikeTelemetry()` es un *fire-and-forget* deliberado: devuelve `void`, traga
 * cualquier error y nunca retrasa ni rompe la respuesta. El like en Postgres ya está
 * escrito cuando se llama; esto es solo el registro remoto.
 *
 * Con la telemetría sin configurar sale por la puerta de atrás sin abrir sockets, así
 * que un `.env` sin `SSH_TELEMETRY_*` deja el endpoint exactamente igual de rápido.
 */

import {
  appendRemoteLine,
  isSshTelemetryEnabled,
  type SshTelemetryOutcome,
} from '../telemetry/ssh-telemetry';

export type LikeTelemetryEvent = {
  action: 'like' | 'unlike';
  entity: 'POST' | 'PROJECT';
  entityId: string;
  /** UUID de la cookie `kc_vid` (identidad anónima del visitante). */
  visitorId?: string | null;
  /** Contador resultante, ya persistido. */
  total?: number;
  source?: string;
};

/** Una línea JSON por evento; se añade al log del nodo de telemetría. */
export function buildLikeTelemetryLine(event: LikeTelemetryEvent): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    kind: 'like',
    action: event.action,
    entity: event.entity,
    entityId: event.entityId,
    visitorId: event.visitorId ?? null,
    ...(event.total === undefined ? {} : { total: event.total }),
    ...(event.source ? { source: event.source } : {}),
  });
}

/** Envía el evento y devuelve el resultado (para tests o scripts de verificación). */
export async function sendLikeTelemetry(event: LikeTelemetryEvent): Promise<SshTelemetryOutcome> {
  return appendRemoteLine(buildLikeTelemetryLine(event));
}

/**
 * Fire-and-forget: se llama con `void` desde el servicio.
 * Ni lanza ni bloquea; con la telemetría desactivada no hace nada.
 */
export function recordLikeTelemetry(event: LikeTelemetryEvent): void {
  if (!isSshTelemetryEnabled()) return;

  void sendLikeTelemetry(event)
    .then((outcome) => {
      if (!outcome.ok) {
        console.warn(
          `[like-telemetry] no se registró ${event.action}/${event.entity} (${outcome.reason ?? 'error'}): ${
            outcome.error ?? 'sin detalle'
          }`,
        );
      }
    })
    .catch((err: unknown) => {
      // Doble red: `sendLikeTelemetry` ya no debería lanzar.
      console.warn(`[like-telemetry] fallo inesperado: ${String((err as Error)?.message ?? err)}`);
    });
}
