import type { Metadata } from 'next';
import { getProjectCategories, getPublishedProjects } from '@/lib/api/projects';
import { FolderKanban } from 'lucide-react';
import { ProjectsFilter } from '@/components/projects/projects-filter';
import { FadeIn } from '@/components/motion/fade-in';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Proyectos',
  description: 'Portfolio de proyectos de desarrollo, infraestructura y open source.',
  alternates: { canonical: '/proyectos' },
};

export default async function ProjectsPage() {
  const [projects, categories] = await Promise.all([
    getPublishedProjects(),
    getProjectCategories(),
  ]);

  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <div className="flex items-center gap-3 text-accent"><FolderKanban className="h-6 w-6" /><span className="font-mono text-sm">/ proyectos</span></div>
          <h1 className="section-title mt-3">Portfolio</h1>
          <p className="section-subtitle">
            Proyectos de software, infraestructura y herramientas open source.
          </p>
        </FadeIn>

        {projects.length > 0 ? (
          <ProjectsFilter projects={projects} categories={categories} />
        ) : (
          <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">Aún no hay proyectos publicados.</div>
        )}
      </div>
    </div>
  );
}
