'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileText,
  FolderKanban,
  GraduationCap,
  Home,
  Menu,
  UserRound,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentNav, siteConfig } from '@kevincarmen/config';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const contentIcons = {
    '/blog': BookOpen,
    '/proyectos': FolderKanban,
    '/cursos': GraduationCap,
    '/recursos': FileText,
  } as const;
  const mainIcons = {
    '/': Home,
    '/sobre-mi': UserRound,
  } as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="section-container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Ir al inicio">
          <Logo size={36} />
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
          aria-label="Navegación principal"
        >
          {siteConfig.nav.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  item.href === '/contacto'
                    ? 'bg-accent text-accent-foreground shadow-sm hover:bg-accent/90'
                    : pathname === item.href || (item.href === '/contenido' && pathname.startsWith('/blog'))
                      ? 'text-accent hover:text-accent'
                      : 'text-muted-foreground hover:text-accent',
                )}
              >
                {item.label}
              </Link>
              {item.href === '/contenido' && (
                <div className="invisible absolute left-0 top-full z-50 w-44 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                  <div className="rounded-lg border border-border bg-card p-1 shadow-xl">
                    {contentNav.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-accent"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border lg:hidden"
          >
            <nav className="section-container flex flex-col gap-1 py-4" aria-label="Menú móvil">
              {siteConfig.nav.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                      item.href === '/contacto'
                        ? 'justify-center rounded-xl bg-accent text-accent-foreground hover:bg-accent/90'
                        : pathname === item.href
                          ? 'bg-muted text-accent'
                          : 'text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {(() => {
                      const Icon = mainIcons[item.href as keyof typeof mainIcons];
                      return Icon ? <Icon className="h-4 w-4" /> : null;
                    })()}
                    {item.label}
                  </Link>
                  {item.href === '/contenido' && (
                    <div className="ml-3 pl-2">
                      {contentNav.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex min-h-11 items-center gap-2 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-accent"
                        >
                          {(() => {
                            const Icon = contentIcons[child.href as keyof typeof contentIcons];
                            return Icon ? <Icon className="h-4 w-4" /> : null;
                          })()}
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
