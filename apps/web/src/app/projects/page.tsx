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

const labServices = [
  ['Proxmox', 'Virtualización de VMs y contenedores LXC.'],
  ['Docker', 'Servicios reproducibles con contenedores y Compose.'],
  ['OpenMediaVault', 'Almacenamiento en red para el laboratorio.'],
  ['Immich', 'Gestión privada de fotografías.'],
  ['Jellyfin', 'Servidor multimedia self-hosted.'],
  ['Navidrome', 'Streaming de música personal.'],
  ['Nextcloud', 'Nube privada para archivos y colaboración.'],
  ['Minecraft', 'Servidor de juego para la comunidad.'],
  ['Grafana', 'Métricas y observabilidad del homelab.'],
];

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

        <FadeIn className="mt-20" id="homelab">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Homelab</h2>
              <p className="mt-2 text-muted-foreground">
                Servicios e infraestructura que forman parte del laboratorio personal.
              </p>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              Lab integrado
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labServices.map(([name, description]) => (
              <article key={name} className="rounded-lg border border-border bg-card/40 p-4">
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
