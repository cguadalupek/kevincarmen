import type { Metadata } from 'next';
import { getPublishedProjects } from '@/lib/api/projects';
import { FolderKanban } from 'lucide-react';
import { PortfolioCard } from '@/components/portfolio-card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';

export const metadata: Metadata = {
  title: 'Proyectos',
  description: 'Portfolio de proyectos de desarrollo, infraestructura y open source.',
  alternates: { canonical: '/proyectos' },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

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
          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <StaggerItem key={project.id}>
                <PortfolioCard
                  href={`/proyectos/${project.slug}`}
                  title={project.title}
                  description={project.description}
                  status={mapProjectStatus(project.status)}
                  stack={project.technologies}
                  repository={project.repository ?? undefined}
                  demo={project.demo ?? undefined}
                  coverImage={project.coverImage ?? undefined}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">Aún no hay proyectos publicados.</div>
        )}
      </div>
    </div>
  );
}

function mapProjectStatus(status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'IN_PROGRESS') {
  return {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
    IN_PROGRESS: 'in-progress',
  }[status] as 'active' | 'completed' | 'archived' | 'in-progress';
}
