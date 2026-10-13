'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { siteConfig } from '@kevincarmen/config';
import { Logo } from '@/components/brand/logo';
import { AdminSidebarPanel } from '@/components/admin/sidebar';
import { cn } from '@/lib/utils';

/**
 * Estructura del panel de administración:
 * - Escritorio (`md:` en adelante): sidebar fijo a la izquierda + contenido centrado.
 * - Móvil (`< md`): header con botón hamburguesa y sidebar como drawer deslizante.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Cerrar el drawer al navegar (también cubre atrás/adelante del navegador).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape, bloqueo del scroll de fondo y foco inicial mientras está abierto.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    drawerRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip md:flex-row">
      {/* overflow-x-clip (no hidden): recorta el desborde horizontal sin crear un
          contenedor de scroll, para que los elementos `sticky` (toolbar del editor)
          sigan anclándose respecto de la ventana. */}
      {/* Sidebar fijo (escritorio) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/50 md:flex">
        <AdminSidebarPanel />
      </aside>

      {/* Header exclusivo de móvil */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-2 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin" className="flex min-w-0 items-center gap-2">
          <Logo size={26} />
          <span className="truncate text-sm font-semibold tracking-wide">{siteConfig.name}</span>
          <span className="font-mono text-xs text-muted-foreground">CMS</span>
        </Link>
      </header>

      {/* Drawer (móvil) */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          open ? 'visible' : 'pointer-events-none invisible',
        )}
        aria-hidden={!open}
      >
        <div
          onClick={close}
          className={cn(
            'absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          id="admin-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de administración"
          tabIndex={-1}
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl outline-none transition-transform duration-300 ease-out',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <AdminSidebarPanel onNavigate={close} onClose={close} />
        </div>
      </div>

      {/* Contenido */}
      <main className="w-full min-w-0 max-w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
