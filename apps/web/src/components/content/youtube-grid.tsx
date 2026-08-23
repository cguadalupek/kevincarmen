'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronRight, Play, Youtube } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import type { PublicVideo } from '@/lib/api/posts';

const PAGE_SIZE = 18; // 3 columnas x 6 filas en escritorio

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
    if (!/youtube\.com|youtube-nocookie\.com/.test(parsed.hostname)) return null;
    return parsed.searchParams.get('v') ?? parsed.pathname.split('/').filter(Boolean).pop() ?? null;
  } catch {
    return null;
  }
}

function thumbnail(video: PublicVideo) {
  if (video.thumbnail) return video.thumbnail;
  const id = youtubeId(video.url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function YoutubeGrid({ videos }: { videos: PublicVideo[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(videos.length / PAGE_SIZE);
  const visibleVideos = useMemo(
    () => videos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [page, videos],
  );

  if (videos.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
        Aún no hay videos de YouTube publicados.
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleVideos.map((video) => {
          const image = thumbnail(video);
          return (
            <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="group block">
              <article className="glass-card h-full overflow-hidden transition hover:-translate-y-1 hover:border-accent/50">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={`Miniatura de ${video.title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : <div className="flex h-full items-center justify-center"><Youtube className="h-10 w-10 text-accent/60" /></div>}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black shadow-lg"><Play className="h-5 w-5 fill-current" /></span>
                  </div>
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"><Youtube className="h-3 w-3" /> YouTube</span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 font-medium transition-colors group-hover:text-accent">{video.title}</h3>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
                    <ArrowUpRight className="h-4 w-4 transition-colors group-hover:text-accent" />
                  </div>
                </div>
              </article>
            </a>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="font-mono text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))} disabled={page >= totalPages - 1} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-accent transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40">
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
