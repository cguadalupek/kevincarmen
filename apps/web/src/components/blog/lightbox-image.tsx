'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface LightboxImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export function LightboxImage({ src, alt, width, height }: LightboxImageProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="group relative block w-full cursor-zoom-in text-left"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar imagen: ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto max-w-full rounded-lg border border-border transition-transform duration-200 group-hover:scale-[1.01]"
          style={{ width: '100%', maxWidth: '100%' }}
          unoptimized
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setOpen(false)}
            aria-label="Cerrar imagen ampliada"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="lightbox-content relative max-h-[90vh] max-w-[95vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={Math.max(width, 1200)}
              height={Math.max(height, 800)}
              className="max-h-[90vh] w-auto max-w-[95vw] rounded-lg object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
