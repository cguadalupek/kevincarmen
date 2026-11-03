/**
 * Cliente de likes (público, sin autenticación).
 *
 * Mismo patrón que `projects.ts`/`posts.ts`: en el servidor se usa `API_INTERNAL_URL`
 * y en el navegador `NEXT_PUBLIC_API_URL` (relativa, para pasar por nginx/Cloudflare).
 */

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

/** Tipos de contenido que admiten «me gusta» (coincide con el enum `LikeEntity`). */
export type LikeEntity = 'POST' | 'PROJECT';

export interface LikeStatus {
  entity: LikeEntity;
  entityId: string;
  count: number;
  /** `true` si el visitante de `visitorId` ya lo marcó. */
  liked: boolean;
}

/**
 * Contadores de varias publicaciones en UNA llamada (los listados pintan 4-6
 * tarjetas; una petición por tarjeta sería absurdo).
 *
 * Pensado para Server Components: si la API falla, devuelve `{}` y las tarjetas se
 * pintan con 0 — un contador no puede tumbar un listado.
 */
export async function getLikeCounts(
  entity: LikeEntity,
  entityIds: string[],
): Promise<Record<string, number>> {
  const ids = Array.from(new Set(entityIds.filter(Boolean)));
  if (ids.length === 0) return {};

  try {
    const res = await fetch(
      `${API_URL}/likes/counts?entity=${entity}&ids=${encodeURIComponent(ids.join(','))}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return {};

    const data = (await res.json()) as { counts?: Record<string, number> };
    return data.counts ?? {};
  } catch {
    return {};
  }
}

/** Estado completo para el visitante actual (contador + si ya lo marcó). */
export async function getLikeStatus(
  entity: LikeEntity,
  entityId: string,
  visitorId: string,
): Promise<LikeStatus> {
  const res = await fetch(
    `${API_URL}/likes?entity=${entity}&entityId=${encodeURIComponent(entityId)}&visitorId=${encodeURIComponent(visitorId)}`,
    { cache: 'no-store' },
  );

  if (!res.ok) throw new Error('No se pudo cargar el estado del like.');

  return (await res.json()) as LikeStatus;
}

/** Alterna el voto del visitante y devuelve el estado ya persistido. */
export async function toggleLike(
  entity: LikeEntity,
  entityId: string,
  visitorId: string,
): Promise<LikeStatus> {
  const res = await fetch(`${API_URL}/likes/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, entityId, visitorId }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'No se pudo guardar el like.' }));
    throw new Error(error.message ?? 'No se pudo guardar el like.');
  }

  return (await res.json()) as LikeStatus;
}
