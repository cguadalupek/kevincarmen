'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  /** URLs de la galería (mismo origen: `/uploads/...`). */
  images: string[];
  /** Título del proyecto, se usa en el alt y en la cabecera del visor. */
  title: string;
  /** Sustantivo del contador, p. ej. «imagen». */
  noun?: string;
}

/**
 * Galería con visor tipo Instagram: al pulsar una imagen se abre a pantalla
 * completa con anterior/siguiente (flechas, teclado y swipe), contador y cierre
 * por Escape, botón X o clic en el fondo.
 */
export function ImageGallery({ images, title, noun = 'imagen' }: ImageGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const open = index !== null;

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setIndex(null), []);
  const goPrev = useCallback(() => {
    setIndex((current) => (current === null ? current : Math.max(0, current - 1)));
  }, []);
  const goNext = useCallback(() => {
    setIndex((current) => (current === null ? current : Math.min(images.length - 1, current + 1)));
  }, [images.length]);

  // Bloqueo del scroll de fondo + teclado + foco dentro del visor.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') goNext();
      else if (event.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, close, goNext, goPrev]);

  // Precarga de las imágenes vecinas para que siguiente/anterior sean instantáneos.
  useEffect(() => {
    if (index === null) return;
    for (const neighbour of [index - 1, index + 1]) {
      const src = images[neighbour];
      if (!src) continue;
      const image = new window.Image();
      image.src = src;
    }
  }, [index, images]);

  if (images.length === 0) return null;

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const end = event.changedTouches[0]?.clientX ?? start;
    const deltaX = end - start;
    if (Math.abs(deltaX) < 50) return;
    if (deltaX < 0) goNext();
    else goPrev();
  };

  return (
    <>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        {images.map((url, i) => (
          <li key={`${url}-${i}`} className="min-w-0">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver ${noun} ${i + 1} de ${images.length} de ${title} en grande`}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${title} · ${noun} ${i + 1}`}
                loading="lazy"
                className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <span className="mb-3 mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                  <ZoomIn className="h-4 w-4" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Galería de ${title}`}
            tabIndex={-1}
            className="gallery-viewer fixed inset-0 z-[100] flex flex-col bg-black outline-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={close}
          >
            <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-2 sm:px-4">
              <span
                className="min-w-14 font-mono text-xs tabular-nums text-white/70"
                aria-live="polite"
              >
                {index + 1} / {images.length}
              </span>
              <span className="hidden truncate text-sm text-white/70 sm:block">{title}</span>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar galería"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-1 py-1 sm:px-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={images[index]}
                src={images[index]}
                alt={`${title} · ${noun} ${index + 1} de ${images.length}`}
                draggable={false}
                onClick={(event) => event.stopPropagation()}
                className="gallery-viewer-image max-h-full max-w-full select-none object-contain"
              />

              {index > 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goPrev();
                  }}
                  aria-label={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} anterior`}
                  className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-3"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goNext();
                  }}
                  aria-label={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} siguiente`}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-3"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
