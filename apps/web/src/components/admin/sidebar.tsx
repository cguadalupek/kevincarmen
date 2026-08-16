'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  FolderOpen,
  GraduationCap,
  FlaskConical,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { clearToken } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Artículos', href: '/admin/posts', icon: FileText },
  { label: 'Proyectos', href: '/admin/projects', icon: FolderOpen },
  { label: 'Cursos', href: '/admin/courses', icon: GraduationCap },
  { label: 'Lab', href: '/admin/lab', icon: FlaskConical, disabled: true },
  { label: 'Configuración', href: '/admin/settings', icon: Settings, disabled: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.push('/admin/login');
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
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

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

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-primary/20 text-accent'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
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
