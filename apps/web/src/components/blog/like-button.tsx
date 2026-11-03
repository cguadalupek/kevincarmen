'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@kevincarmen/utils';
import { getLikeStatus, toggleLike, type LikeEntity } from '@/lib/api/likes';

/** Cookie que identifica al visitante anónimo (unlike por navegador, no por cuenta). */
const VISITOR_COOKIE = 'kc_vid';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `crypto.randomUUID` no existe fuera de contexto seguro (http en LAN): respaldo manual. */
function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readVisitorId(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return value && UUID_RE.test(value) ? value : null;
}

function ensureVisitorId(): string {
  const existing = readVisitorId();
  if (existing) return existing;

  const created = randomUuid();
  document.cookie = `${VISITOR_COOKIE}=${created}; path=/; max-age=${VISITOR_MAX_AGE}; samesite=lax`;
  return created;
}

interface LikeButtonProps {
  entity: LikeEntity;
  entityId: string;
  /** Contador renderizado en el servidor: se pinta al instante, sin salto de layout. */
  initialCount?: number;
  className?: string;
}

/**
 * Botón «me gusta» con respuesta optimista: el estado visual cambia al pulsar y, si
 * la API falla, se revierte y se muestra el mensaje. Nunca lanza: un fallo del
 * contador no puede romper la lectura del artículo.
 */
export function LikeButton({ entity, entityId, initialCount = 0, className }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El `visitorId` vive en una cookie, así que solo se puede leer en el navegador.
  useEffect(() => {
    const id = ensureVisitorId();
    setVisitorId(id);

    let cancelled = false;
    getLikeStatus(entity, entityId, id)
      .then((status) => {
        if (cancelled) return;
        setCount(status.count);
        setLiked(status.liked);
      })
      .catch(() => {
        /* se queda con el contador del servidor; el botón sigue siendo pulsable */
      });

    return () => {
      cancelled = true;
    };
  }, [entity, entityId]);

  const handleClick = useCallback(async () => {
    if (pending || !visitorId) return;

    const previous = { count, liked };
    setPending(true);
    setError(null);
    // Optimista: el usuario ve el cambio ya, sin esperar a la red.
    setLiked(!previous.liked);
    setCount(Math.max(0, previous.count + (previous.liked ? -1 : 1)));

    try {
      const status = await toggleLike(entity, entityId, visitorId);
      setCount(status.count);
      setLiked(status.liked);
    } catch (err) {
      setLiked(previous.liked);
      setCount(previous.count);
      setError(err instanceof Error ? err.message : 'No se pudo guardar el like.');
    } finally {
      setPending(false);
    }
  }, [count, entity, entityId, liked, pending, visitorId]);

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
        className={cn(
          'inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-medium',
          'transition-colors motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          liked
            ? 'border-accent bg-accent/10 text-accent'
            : 'border-border bg-muted/40 text-muted-foreground hover:border-accent hover:text-accent',
          'disabled:cursor-not-allowed disabled:opacity-70',
        )}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors motion-reduce:transition-none',
            liked && 'fill-current',
          )}
          aria-hidden="true"
        />
        <span className="tabular-nums">{count}</span>
        <span className="sr-only">{liked ? 'me gusta (ya marcado)' : 'me gusta'}</span>
      </button>

      <span aria-live="polite" className="text-xs text-muted-foreground">
        {error ?? ''}
      </span>
    </div>
  );
}
