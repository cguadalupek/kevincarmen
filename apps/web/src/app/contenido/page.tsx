import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, FileText, FolderKanban, GraduationCap, Server, Youtube } from 'lucide-react';
import { contentNav } from '@kevincarmen/config';
import { getLatestVideos } from '@/lib/api/posts';
import { YoutubeGrid } from '@/components/content/youtube-grid';

export const metadata: Metadata = {
  title: 'Contenido',
  description: 'Blog, proyectos, cursos, recursos y laboratorio de Kevin Carmen.',
  alternates: { canonical: '/contenido' },
};

const sectionMeta: Record<string, { icon: typeof BookOpen; description: string }> = {
  '/blog': {
    icon: BookOpen,
    description: 'Guías, artículos y documentación técnica.',
  },
  '/proyectos': {
    icon: FolderKanban,
    description: 'Infraestructura, homelabs y software.',
  },
  '/cursos': {
    icon: GraduationCap,
    description: 'Formación práctica y tutoriales paso a paso.',
  },
  '/recursos': {
    icon: FileText,
    description: 'Plantillas, scripts y herramientas útiles.',
  },
  '/lab': {
    icon: Server,
    description: 'Servidores, contenedores y operaciones de mi laboratorio.',
  },
};

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const youtubeVideos = (await getLatestVideos(500)).filter(
    (video) => video.videoType === 'YOUTUBE' || video.videoType === 'YOUTUBE_SHORT',
  );
  const sections = contentNav
    .map((item) => ({ item, meta: sectionMeta[item.href] }))
    .filter(
      (entry): entry is { item: (typeof contentNav)[number]; meta: (typeof sectionMeta)[string] } =>
        Boolean(entry.meta),
    );

  return (
    <div className="py-16">
      <div className="section-container max-w-5xl">
        <h1 className="section-title">Contenido</h1>
        <p className="section-subtitle">
          Tutoriales, proyectos, recursos y experimentación desde mi homelab.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <h2 className="text-lg font-semibold text-accent">{item.label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
              </Link>
            );
          })}
        </div>
        <div className="mt-16 flex items-center gap-3 text-accent">
          <Youtube className="h-6 w-6" />
          <span className="font-mono text-sm">/ videos de youtube</span>
        </div>
        <h2 className="mt-3 text-2xl font-bold">Videos publicados</h2>
        <p className="mt-2 text-muted-foreground">Todos mis videos de YouTube, ordenados por publicación.</p>
        <YoutubeGrid videos={youtubeVideos} />
      </div>
    </div>
  );
}
