'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, GraduationCap, LogIn, LogOut, UserPlus } from 'lucide-react';
import {
  STUDENT_SESSION_EVENT,
  type StudentUser,
  clearStudentSession,
  getStudentUser,
} from '@/lib/api/progress';
import { replaceLocalProgress } from '@/lib/course-progress';
import { cn } from '@/lib/utils';

/** Iniciales para el avatar (las cuentas de alumno no tienen foto). */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return `${parts[0][0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/**
 * Estado de sesión del ALUMNO en la cabecera.
 *
 * Sin sesión: «Iniciar sesión» + «Registrarse». Con sesión: avatar con iniciales,
 * nombre y un menú con el correo, el acceso a los cursos y «Cerrar sesión».
 *
 * El primer render (servidor incluido) asume invitado, que es el caso mayoritario:
 * así no hay desajuste de hidratación ni salto de maquetación. Si hay token, el
 * efecto lo detecta y cambia a la vista de perfil.
 *
 * Al cerrar sesión se vacía TAMBIÉN el espejo local del progreso: si no, el
 * siguiente visitante del mismo navegador vería las barras de otra persona. El
 * avance real sigue en la nube y vuelve al entrar de nuevo.
 */
export function StudentSessionMenu({
  variant = 'desktop',
  onNavigate,
}: {
  variant?: 'desktop' | 'mobile';
  /**
   * Se llama al pulsar cualquier enlace o «Cerrar sesión». La cabecera lo usa para
   * cerrar el menú de hamburguesa: sin esto, al entrar a `/cuenta/ingresar` el
   * Header (que persiste entre rutas) mantiene `mobileOpen` en `true` y el panel
   * sigue abierto encima del formulario.
   */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setUser(getStudentUser());
    sync();
    window.addEventListener(STUDENT_SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(STUDENT_SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Cerrar el menú al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function logout() {
    clearStudentSession();
    replaceLocalProgress([]);
    setUser(null);
    setOpen(false);
    onNavigate?.();
    router.refresh();
  }

  const next = encodeURIComponent(pathname || '/cursos');

  if (!user) {
    if (variant === 'mobile') {
      return (
        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
          <Link
            href={`/cuenta/ingresar?next=${next}`}
            onClick={onNavigate}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground"
          >
            <LogIn className="h-4 w-4" /> Iniciar sesión
          </Link>
          <Link
            href={`/cuenta/registro?next=${next}`}
            onClick={onNavigate}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground"
          >
            <UserPlus className="h-4 w-4" /> Registrarse
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/cuenta/ingresar?next=${next}`}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
        >
          <LogIn className="h-4 w-4" /> Iniciar sesión
        </Link>
        <Link
          href={`/cuenta/registro?next=${next}`}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:border-accent/50 hover:text-accent"
        >
          <UserPlus className="h-4 w-4" /> Registrarse
        </Link>
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-semibold text-accent">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Link
          href="/cursos"
          onClick={() => {
            setOpen(false);
            onNavigate?.();
          }}
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-accent"
        >
          <GraduationCap className="h-4 w-4" /> Mis cursos
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Cuenta de ${user.name}`}
        className="flex min-h-[36px] items-center gap-2 rounded-lg border border-border px-2 py-1 text-sm transition-colors hover:border-accent/50"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] font-semibold text-accent">
          {initials(user.name)}
        </span>
        <span className="max-w-[9rem] truncate font-medium">{user.name}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-card p-1.5 shadow-xl"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Link
            href="/cursos"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-[40px] items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
          >
            <GraduationCap className="h-4 w-4" /> Mis cursos
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
