'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MonitorPlay, Youtube } from 'lucide-react';

interface LessonVideoProps {
  videoUrl: string;
  title: string;
  /** Se dispara cuando el video llega al final (youtube). */
  onEnded?: () => void;
}

interface ParsedVideo {
  kind: 'youtube' | 'vimeo' | 'mp4' | 'generic' | null;
  embedSrc: string | null;
  poster: string | null;
}

function parseVideo(src: string): ParsedVideo {
  try {
    const url = new URL(src);
    const host = url.hostname;

    if (/youtube\.com|youtu\.be/.test(host)) {
      let id = '';
      if (host === 'youtu.be') id = url.pathname.slice(1).split('?')[0];
      else if (url.searchParams.get('v')) id = url.searchParams.get('v') as string;
      else if (host === 'www.youtube.com' || host === 'youtube.com') {
        id = url.pathname.split('/').pop() ?? '';
      }
      if (!id) return { kind: null, embedSrc: null, poster: null };
      // origin fijo: el iframe de YouTube valida el origin real del navegador,
      // este parámetro es solo una pista para algunas APIs del rep
      return {
        kind: 'youtube',
        embedSrc: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&color=white&enablejsapi=1&origin=https%3A%2F%2Fkevincarmen.xyz`,
        poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    }

    if (/vimeo\.com/.test(host)) {
      const id = url.pathname.split('/').pop() ?? '';
      if (!id) return { kind: null, embedSrc: null, poster: null };
      return { kind: 'vimeo', embedSrc: `https://player.vimeo.com/video/${id}`, poster: null };
    }

    if (/\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(src)) {
      return { kind: 'mp4', embedSrc: src, poster: null };
    }

    return { kind: 'generic', embedSrc: src, poster: null };
  } catch {
    return { kind: null, embedSrc: null, poster: null };
  }
}

export function LessonVideo({ videoUrl, title, onEnded }: LessonVideoProps) {
  const parsed = useMemo(() => parseVideo(videoUrl), [videoUrl]);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Detección de fin de video (YouTube IFrame API vía postMessage, sin dep).
  useEffect(() => {
    if (parsed.kind !== 'youtube') return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube-nocookie.com' && event.origin !== 'https://www.youtube.com') {
        return;
      }
      if (typeof event.data !== 'string' || !event.data.includes('onStateChange')) return;
      try {
        const payload = JSON.parse(event.data);
        // 0 = terminó, 1 = reproduciendo, 2 = pausa
        if (payload.event === 'onStateChange' && payload.info === 0) {
          onEndedRef.current?.();
        }
      } catch {
        // mensaje no JSON: ignorar
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [parsed.kind]);

  if (!parsed.embedSrc) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted/40">
        <span className="text-sm text-muted-foreground">URL de video no reconocida</span>
      </div>
    );
  }

  if (parsed.kind === 'mp4') {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <video controls preload="metadata" className="aspect-video w-full" src={parsed.embedSrc}>
          Tu navegador no soporta video HTML5.
        </video>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      <div className="relative flex items-center gap-2 border-b border-border/60 bg-card px-4 py-2 text-xs text-muted-foreground">
        {parsed.kind === 'youtube' ? (
          <Youtube className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <MonitorPlay className="h-3.5 w-3.5 text-accent" />
        )}
        <span className="truncate">{title}</span>
      </div>
      <iframe
        key={parsed.embedSrc}
        src={parsed.embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="aspect-video w-full"
      />
    </div>
  );
}