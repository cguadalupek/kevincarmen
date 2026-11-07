'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cloud, X } from 'lucide-react';

const DISMISS_KEY = 'kc_progress_prompt_dismissed';

/**
 * Aviso de sincronización para invitados: barra pegajosa bajo la cabecera, no un
 * modal ni un bloqueo. El modelo es freemium NO intrusivo — el capítulo se lee
 * igual; lo único que cambia con una cuenta es que el progreso viaja entre
 * dispositivos.
 *
 * Se puede ocultar y la decisión se recuerda (`kc_progress_prompt_dismissed`), así
 * que no vuelve a aparecer en cada clase.
 */
export function CourseSyncBar({ done }: { done: number }) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (dismissed) return null;

  const next = encodeURIComponent(pathname || '/cursos');

  return (
    <div className="sticky top-16 z-20 mb-5 flex items-start gap-3 rounded-xl border border-accent/25 bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur">
      <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-muted-foreground">
        {done > 0 ? (
          <>
            Llevas <span className="font-semibold text-foreground">{done}</span>{' '}
            {done === 1 ? 'clase guardada' : 'clases guardadas'} solo en este navegador.
          </>
        ) : (
          <>Tu progreso se guarda solo en este navegador.</>
        )}{' '}
        <span className="text-foreground">Crea una cuenta gratis</span> y consérvalo entre
        dispositivos.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/cuenta/registro?next=${next}`}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:min-h-[36px]"
        >
          Crear cuenta
        </Link>
        <Link
          href={`/cuenta/ingresar?next=${next}`}
          className="hidden min-h-[36px] items-center rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors hover:border-accent/50 sm:inline-flex"
        >
          Entrar
        </Link>
        <button
          type="button"
          aria-label="Ocultar aviso de sincronización"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, '1');
            setDismissed(true);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
