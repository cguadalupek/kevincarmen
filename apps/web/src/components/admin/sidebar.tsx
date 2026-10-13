'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Video,
  X,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { clearToken } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
  /** Si existe, el item actúa como grupo y se despliega un submenu. */
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Inicio', href: '/admin/inicio', icon: Home },
  { label: 'Sobre mí', href: '/admin/sobre-mi', icon: User },
  {
    label: 'Artículos',
    href: '/admin/posts',
    icon: FileText,
    children: [
      { label: 'Artículos', href: '/admin/posts' },
      { label: 'Categorías', href: '/admin/categorias' },
    ],
  },
  { label: 'Videos', href: '/admin/videos', icon: Video },
  { label: 'Proyectos', href: '/admin/projects', icon: FolderOpen },
  { label: 'Cursos', href: '/admin/courses', icon: GraduationCap },
  { label: 'Lab', href: '/admin/lab', icon: FlaskConical },
  { label: 'Recursos', href: '/admin/recursos', icon: Download },
  { label: 'Timeline', href: '/admin/timeline', icon: Clock },
  { label: 'Configuración', href: '/admin/settings', icon: Settings },
];

/** Área mínima de toque recomendada en pantallas táctiles. */
const TOUCH_TARGET = 'min-h-[44px]';

interface AdminSidebarPanelProps {
  /** Se ejecuta al navegar (usado para cerrar el drawer en móvil). */
  onNavigate?: () => void;
  /** Si se pasa, muestra el botón de cierre (solo en el drawer móvil). */
  onClose?: () => void;
}

/**
 * Contenido del panel de navegación del admin. Se reutiliza tal cual en el
 * sidebar fijo de escritorio y en el drawer deslizante de móvil.
 */
export function AdminSidebarPanel({ onNavigate, onClose }: AdminSidebarPanelProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Grupo de Artículos desplegado si estás en cualquiera de sus hijos (o en él).
  const [expanded, setExpanded] = useState<string | null>(() => {
    const group = navItems.find((item) =>
      item.children?.some((child) => pathname.startsWith(child.href)),
    );
    return group?.href ?? null;
  });

  function logout() {
    clearToken();
    router.push('/admin/login');
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function rowClass(active: boolean) {
    return cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
      TOUCH_TARGET,
      active
        ? 'bg-primary/20 text-accent'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-2 border-b border-border p-5">
        <div className="min-w-0">
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn('inline-flex items-center', TOUCH_TARGET)}
          >
            <Logo size={32} showText />
          </Link>
          <p className="font-mono text-xs text-muted-foreground">CMS · Panel admin</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground',
              'hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3"
        aria-label="Navegación del panel"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.disabled) {
            return (
              <span
                key={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50',
                  TOUCH_TARGET,
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto text-xs">Pronto</span>
              </span>
            );
          }

          if (item.children) {
            const open = expanded === item.href;
            const childActive = item.children.some((child) => isActive(child.href));
            return (
              <div key={item.href}>
                <div className="flex items-center gap-1">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      if (childActive) {
                        e.preventDefault();
                        setExpanded(open ? null : item.href);
                        return;
                      }
                      setExpanded(item.href);
                      onNavigate?.();
                    }}
                    className={cn(rowClass(childActive), 'flex-1')}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : item.href)}
                    aria-label={open ? 'Contraer submenú' : 'Desplegar submenú'}
                    aria-expanded={open}
                    className="inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {open && (
                  <div className="mt-1 space-y-0.5 border-l border-border/60 pl-3 ml-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={isActive(child.href) ? 'page' : undefined}
                        className={cn(
                          'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                          TOUCH_TARGET,
                          isActive(child.href)
                            ? 'bg-primary/15 text-accent'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={rowClass(active)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className={cn(
            'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-accent',
            TOUCH_TARGET,
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Ver sitio público
        </Link>
        <button
          type="button"
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            TOUCH_TARGET,
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
