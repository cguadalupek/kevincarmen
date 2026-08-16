'use client';

import { useMemo, useState } from 'react';
import { Play, Youtube } from 'lucide-react';

interface VideoEmbedProps {
  src: string;
  title: string;
  width?: string;
  height?: string;
}

export function VideoEmbed({ src, title, width, height }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const { embedUrl, poster, provider } = useMemo(() => analyzeVideo(src), [src]);
  const ratioStyle = useMemo(() => buildAspectStyle(width, height), [width, height]);

  const ratioMatch = width && height ? width + '/' + height : '16/9';

  if (playing) {
    return (
      <div className="my-8 overflow-hidden rounded-xl border border-border" style={ratioStyle}>
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-border bg-black/80 text-white shadow-lg">
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group relative block w-full focus:outline-none"
        aria-label={`Reproducir video ${title}`}
        style={ratioStyle}
      >
        {poster ? (
          <img
            src={poster}
            alt={`Miniatura del video ${title}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">Video sin miniatura</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/50">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition-transform group-hover:scale-110">
            <Play className="h-10 w-10 fill-current" />
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-medium text-white drop-shadow">{title}</span>
          <span className="flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-white">
            <ProviderLogo provider={provider} />
            <span className="uppercase tracking-wide">{provider}</span>
          </span>
        </div>
      </button>
      {!playing && (
        <figcaption className="hidden">{title}</figcaption>
      )}
    </figure>
  );

  void ratioMatch;
}

function ProviderLogo({ provider }: { provider: string }) {
  if (provider === 'youtube') return <Youtube className="h-3 w-3" />;
  return null;
}

function analyzeVideo(src: string) {
  let provider = 'video';
  let poster: string | null = null;
  let embedUrl = src;

  try {
    const url = new URL(src);
    const host = url.hostname;

    if (/youtube\.com|youtu\.be/.test(host)) {
      provider = 'youtube';
      let id = '';
      if (host === 'youtu.be') id = url.pathname.slice(1);
      else id = url.searchParams.get('v') ?? url.pathname.split('/').pop() ?? '';
      if (id) {
        embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
        poster = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }
    } else if (/youtube-nocookie/.test(host)) {
      provider = 'youtube';
      const id = url.pathname.split('/').pop() ?? '';
      if (id) {
        embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`;
        poster = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }
    }
  } catch {
    // ignore invalid URL
  }

  return { embedUrl, poster, provider };
}

function buildAspectStyle(width?: string, height?: string) {
  const w = Number.parseInt(width ?? '0', 10);
  const h = Number.parseInt(height ?? '0', 10);
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
    return { aspectRatio: `${w} / ${h}` };
  }
  return { aspectRatio: '16 / 9' };
}
