'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminModalProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  /** Botonera fija al pie (se apila a ancho completo en móvil). */
  footer?: React.ReactNode;
  /** Ancho máximo del panel a partir de `sm`. */
  maxWidthClass?: string;
}

/**
 * Vista superpuesta del panel.
 *
 * Se monta con un PORTAL en `document.body` y no dentro del formulario: `position: fixed`
 * se resuelve contra el primer ancestro que crea bloque contenedor, y eso ocurre con
 * cualquier `backdrop-filter`/`transform`/`filter`. Las secciones del panel usan
 * `.glass-card` (`backdrop-blur-sm`), así que la capa `inset-0` quedaba anclada al
 * recuadro del formulario en vez de al viewport: la ventana salía alta, centrada en esa
 * tarjeta y con la cabecera fuera de la pantalla. En un portal compite en el contexto de
 * apilado raíz, igual que el menú `/` del editor (ver `cms-sections.ts`).
 *
 * Mobile-first: en pantallas estrechas es una hoja pegada al borde inferior que ocupa
 * el ancho completo y como mucho el 92 % del ALTO VISIBLE (clase `admin-modal-panel`,
 * definida en `globals.css`; el cuerpo hace su propio scroll); a partir de `sm` es un
 * diálogo centrado. La cabecera y el pie van fuera del área de scroll, así el título y
 * los botones Guardar/Cancelar nunca se pierden al bajar por un formulario largo.
 */
export function AdminModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidthClass = 'sm:max-w-2xl',
}: AdminModalProps) {
  // El portal necesita `document`: el primer render (SSR/hidratación) sale vacío.
  const [mounted, setMounted] = useState(false);

  // Escape cierra y el fondo no se desplaza mientras está abierto.
  useEffect(() => {
    setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Ventana de edición'}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        className={cn(
          'admin-modal-panel relative flex w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl',
          maxWidthClass,
        )}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/*
          El área de scroll NO lleva padding: el relleno va en el wrapper interior
          para que una barra `sticky top-0` (la del editor enriquecido) quede pegada
          al borde superior al desplazarse y no deje una franja por la que se vea el
          contenido pasando por detrás.
        */}
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
        </div>

        {footer ? (
          <div className="flex shrink-0 flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
