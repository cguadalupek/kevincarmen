import type { Metadata } from 'next';
import { ExternalLink, Github } from 'lucide-react';
import { featuredProjects } from '@/lib/data/mock';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Proyectos',
  description: 'Portfolio de proyectos de desarrollo, infraestructura y open source.',
};

const statusLabels = {
  active: 'Activo',
  completed: 'Completado',
  archived: 'Archivado',
  'in-progress': 'En desarrollo',
};

const statusColors = {
  active: 'bg-accent/10 text-accent',
  completed: 'bg-primary/20 text-primary-foreground',
  archived: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-accent/10 text-accent',
};

export default function ProjectsPage() {
  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <h1 className="section-title">Portfolio</h1>
          <p className="section-subtitle">
            Proyectos de software, infraestructura y herramientas open source.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2">
          {featuredProjects.map((project) => (
            <StaggerItem key={project.id}>
              <article className="glass-card group flex h-full flex-col p-6 hover-lift">
                <div className="mb-4 flex items-start justify-between">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      statusColors[project.status],
                    )}
                  >
                    {statusLabels[project.status]}
                  </span>
                  <div className="flex gap-2">
                    {project.repository && (
                      <a
                        href={project.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-accent"
                        aria-label="Repositorio"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-accent"
                        aria-label="Demo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-semibold">{project.title}</h2>
                <p className="mt-3 flex-1 text-muted-foreground">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}
