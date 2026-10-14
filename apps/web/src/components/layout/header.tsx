'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronsDownUp,
  ChevronsUpDown,
  FileText,
  FlaskConical,
  FolderKanban,
  GraduationCap,
  Home,
  Layers,
  Menu,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentNav, siteConfig } from '@kevincarmen/config';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);
  const pathname = usePathname();
  const contentIcons = {
    '/blog': BookOpen,
    '/proyectos': FolderKanban,
    '/cursos': GraduationCap,
    '/recursos': FileText,
    '/lab': FlaskConical,
    '/videos': Video,
  } as const;
  const mainIcons = {
    '/': Home,
    '/sobre-mi': UserRound,
    '/contenido': Layers,
  } as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Ir al inicio" className="flex items-center gap-2">
          <Logo size={36} />
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          aria-label="Navegación principal"
        >
          {siteConfig.nav
            .filter((item) => item.href !== '/contacto')
            .map((item) => (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href || (item.href === '/contenido' && pathname.startsWith('/blog'))
                      ? 'text-accent hover:text-accent'
                      : 'text-muted-foreground hover:text-accent',
                  )}
                >
                  {item.label}
                </Link>
                {item.href === '/contenido' && (
                  <div className="invisible absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
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

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="accent">
            <Link
              href="/contacto"
              className="justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
            >
              Contacto
            </Link>
          </Button>
        </div>

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
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8" aria-label="Menú móvil">
              {siteConfig.nav.map((item) => {
                if (item.href === '/contenido') {
                  const Icon = mainIcons['/contenido'];
                  return (
                    <div key={item.href}>
                      <button
                        type="button"
                        onClick={() => setContentExpanded((value) => !value)}
                        aria-expanded={contentExpanded}
                        className={cn(
                          'flex w-full min-h-11 items-center gap-2 rounded-md px-3 py-3 text-left text-sm font-medium transition-colors',
                          pathname === item.href || pathname.startsWith('/blog')
                            ? 'bg-muted text-accent'
                            : 'text-muted-foreground hover:bg-muted/50',
                        )}
                      >
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        <span className="flex-1">{item.label}</span>
                        {contentExpanded ? (
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronsDownUp className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <AnimatePresence initial={false}>
                        {contentExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden pl-3"
                          >
                            <div className="flex flex-col gap-1 border-l border-border pl-3">
                              {contentNav.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex min-h-11 items-center gap-2 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-accent"
                                >
                                  {(() => {
                                    const Icon =
                                      contentIcons[child.href as keyof typeof contentIcons];
                                    return Icon ? <Icon className="h-4 w-4" /> : null;
                                  })()}
                                  {child.label}
                                </Link>
                              ))}
                              <Link
                                href="/videos"
                                onClick={() => setMobileOpen(false)}
                                className="flex min-h-11 items-center gap-2 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-accent"
                              >
                                <Video className="h-4 w-4" /> Videos
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                const Icon = mainIcons[item.href as keyof typeof mainIcons];
                return (
                  <Link
                    key={item.href}
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
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Button({
  children,
  variant,
  asChild,
  className,
}: {
  children: React.ReactNode;
  variant?: 'accent';
  asChild?: boolean;
  className?: string;
}) {
  void variant;
  void asChild;
  return <>{children}</>;
}
