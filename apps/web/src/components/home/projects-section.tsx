'use client';

import Link from 'next/link';
import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import type { PublicProject } from '@/lib/api/projects';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';



interface ProjectsSectionProps {
  projects: PublicProject[];
}

/**
 * Tope de destacados en la portada: con más de 6 la sección se vuelve un listado
 * largo y empuja el resto de la home demasiado abajo. El resto vive en /proyectos.
 */
const MAX_FEATURED_PROJECTS = 6;

const statusLabels = {
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  ARCHIVED: 'Archivado',
  IN_PROGRESS: 'En desarrollo',
} as const;

const statusColors = {
  ACTIVE: 'bg-accent/10 text-accent',
  COMPLETED: 'bg-primary/20 text-primary-foreground',
  ARCHIVED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-accent/10 text-accent',
} as const;

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  // El API ya los devuelve en el orden manual del panel (position asc): el tope se
  // aplica al final, sin reordenar.
  const featuredProjects = projects
    .filter((project) => project.featured)
    .slice(0, MAX_FEATURED_PROJECTS);

  const hasMore =
    projects.filter((project) => project.featured).length > MAX_FEATURED_PROJECTS ||
    projects.length > MAX_FEATURED_PROJECTS;

  return (
    <section className="py-20" id="proyectos">
      <div className="section-container">
        <FadeIn className="flex items-end justify-between">
          <div>
            <h2 className="section-title">Proyectos destacados</h2>
            <p className="section-subtitle">
              Algunos de los proyectos en los que estoy trabajando o he completado.
            </p>
          </div>
          <Link
            href="/proyectos"
            className="hidden items-center gap-1 text-sm text-accent transition-colors hover:text-accent/80 sm:flex"
          >
            Ver todos
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
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

                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{project.description}</p>

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

        {hasMore && (
          <FadeIn className="mt-8 text-center sm:hidden">
            <Link href="/proyectos" className="text-sm text-accent">
              Ver todos los proyectos →
            </Link>
          </FadeIn>
        )}
      </div>
    </section>
  );
}
