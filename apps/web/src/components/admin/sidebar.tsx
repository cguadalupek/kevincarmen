'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  Video,
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
  { label: 'Timeline', href: '/admin/timeline', icon: Clock },
  { label: 'Configuración', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
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
      active
        ? 'bg-primary/20 text-accent'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/50">
      <div className="border-b border-border p-5">
        <Link href="/admin">
          <Logo size={32} showText />
        </Link>
        <p className="mt-2 font-mono text-xs text-muted-foreground">CMS · Panel admin</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/50"
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
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (childActive) {
                        e.preventDefault();
                        setExpanded(open ? null : item.href);
                        return;
                      }
                      setExpanded(item.href);
                    }}
                    className={cn(rowClass(childActive), 'flex-1')}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : item.href)}
                    aria-label={open ? 'Contraer' : 'Desplegar'}
                    className="mr-1 rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {open && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-border/60 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block rounded-md px-3 py-2 text-sm transition-colors',
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
            <Link key={item.href} href={item.href} className={rowClass(isActive(item.href))}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="mb-2 block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-accent"
        >
          ← Ver sitio público
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
