'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CloudUpload, X } from 'lucide-react';

const DISMISS_KEY = 'kc_progress_prompt_dismissed';

/**
 * Aviso de sincronización para invitados: barra pegajosa bajo la cabecera, con el
 * acento cian del sitio. No es un modal ni un bloqueo: el capítulo se lee igual y
 * el progreso local funciona sin cuenta. Lo único que cambia al registrarse es que
 * el avance viaja entre dispositivos.
 *
 * Se puede ocultar y la decisión se recuerda (`kc_progress_prompt_dismissed`), así
 * que no reaparece en cada clase.
 */
export function CourseSyncBar() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (dismissed) return null;

  const next = encodeURIComponent(pathname || '/cursos');

  return (
    <div className="sticky top-16 z-20 mb-5 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2.5 shadow-sm backdrop-blur">
      <CloudUpload aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-muted-foreground">
        Tu progreso se guarda solo en este navegador.{' '}
        <span className="font-medium text-foreground">Crea una cuenta gratis</span> y consérvalo en
        otros dispositivos.
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
