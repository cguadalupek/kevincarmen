'use client';

import { useEffect } from 'react';
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
 * Mobile-first: en pantallas estrechas es una hoja pegada al borde inferior que ocupa
 * el ancho completo y como mucho el 92 % del alto (el cuerpo hace su propio scroll);
 * a partir de `sm` es un diálogo centrado. La cabecera y el pie van fuera del área
 * de scroll, así el título y los botones Guardar/Cancelar nunca se pierden al bajar
 * por un formulario largo.
 */
export function AdminModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidthClass = 'sm:max-w-2xl',
}: AdminModalProps) {
  // Escape cierra y el fondo no se desplaza mientras está abierto.
  useEffect(() => {
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl',
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

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>

        {footer ? (
          <div className="flex shrink-0 flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
