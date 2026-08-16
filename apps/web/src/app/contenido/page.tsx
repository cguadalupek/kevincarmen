import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FolderKanban, GraduationCap, FileText } from 'lucide-react';
import { contentNav } from '@kevincarmen/config';

export const metadata: Metadata = {
  title: 'Contenido',
  description: 'Blog, proyectos, cursos y recursos de Kevin Carmen.',
  alternates: { canonical: '/contenido' },
};

const sectionMeta: Record<
  string,
  { icon: typeof BookOpen; description: string; items: string[] }
> = {
  '/blog': {
    icon: BookOpen,
    description: 'Guías, artículos y documentación técnica.',
    items: [],
  },
  '/proyectos': {
    icon: FolderKanban,
    description: 'Infraestructura, homelabs y software.',
    items: [],
  },
  '/cursos': {
    icon: GraduationCap,
    description: 'Formación práctica y tutoriales paso a paso.',
    items: [],
  },
  '/recursos': {
    icon: FileText,
    description: 'Plantillas, scripts y herramientas útiles.',
    items: [],
  },
};

export default function ContentPage() {
  const sections = contentNav
    .map((item) => ({ item, meta: sectionMeta[item.href] }))
    .filter((entry): entry is { item: (typeof contentNav)[number]; meta: typeof sectionMeta[string] } => Boolean(entry.meta));

  return (
    <div className="py-16">
      <div className="section-container max-w-5xl">
        <h1 className="section-title">Contenido</h1>
        <p className="section-subtitle">
          Tutoriales, proyectos y formación sobre desarrollo, infraestructura y tecnología.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map(({ item, meta }) => {
            const Icon = meta.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group block rounded-xl border border-border bg-card/40 p-5 transition-all duration-200 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="flex items-baseline gap-2 text-lg font-semibold text-accent">
                  <Icon className="h-4 w-4 text-cyan-400" />
                  {item.label}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
