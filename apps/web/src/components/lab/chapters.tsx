'use client';

import { ListVideo } from 'lucide-react';

interface Chapter {
  time: string;
  title: string;
}

/** "mm:ss" o "hh:mm:ss" → segundos (para saltar en YouTube con ?t=). */
function timeToSeconds(time: string): number | null {
  const parts = time.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part)) || parts.length > 3) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function withTimestamp(url: string, seconds: number) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      parsed.searchParams.set('t', `${seconds}s`);
      return parsed.toString();
    }
  } catch {
    // URL inválida: se deja el enlace sin timestamp.
  }
  return url;
}

export function LabChapters({ chapters, videoUrl }: { chapters: Chapter[]; videoUrl: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <h2 className="mb-4 flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-accent">
        <ListVideo className="h-4 w-4" /> Capítulos del video
      </h2>
      <ol className="space-y-1">
        {chapters.map((chapter, index) => {
          const seconds = timeToSeconds(chapter.time);
          const href = seconds !== null ? withTimestamp(videoUrl, seconds) : videoUrl;
          return (
            <li key={`${chapter.time}-${chapter.title}-${index}`}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/50"
              >
                <span className="w-16 shrink-0 font-mono text-sm text-accent">
                  {chapter.time.trim() || '—'}
                </span>
                <span className="flex-1 text-sm text-muted-foreground transition group-hover:text-foreground">
                  {chapter.title}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
