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
 * Contador público de una entidad, sin identidad de visitante.
 *
 * Pensado para Server Components: si la API falla o el contenido no existe, devuelve
 * `0` en vez de tumbar la página (un contador no puede romper un artículo).
 */
export async function getLikeCount(entity: LikeEntity, entityId: string): Promise<number> {
  try {
    const res = await fetch(
      `${API_URL}/likes?entity=${entity}&entityId=${encodeURIComponent(entityId)}`,
      { cache: 'no-store' },
    );

    if (!res.ok) return 0;

    const data = (await res.json()) as Partial<LikeStatus>;
    return typeof data.count === 'number' ? data.count : 0;
  } catch {
    return 0;
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
