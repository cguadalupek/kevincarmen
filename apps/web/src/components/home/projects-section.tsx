'use client';

import Link from 'next/link';
import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import { featuredProjects } from '@/lib/data/mock';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

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

export function ProjectsSection() {
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
            href="/projects"
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

        <FadeIn className="mt-8 text-center sm:hidden">
          <Link href="/projects" className="text-sm text-accent">
            Ver todos los proyectos →
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
