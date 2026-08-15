import type { Metadata } from 'next';
import { Download, FileCode, FileSpreadsheet, FileText, Container } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';

export const metadata: Metadata = {
  title: 'Recursos',
  description: 'Scripts, plantillas, Docker Compose y recursos descargables gratuitos.',
  alternates: { canonical: '/recursos' },
};

const resources = [
  {
    id: '1',
    title: 'Scripts PowerShell para Sysadmin',
    description: 'Colección de scripts para administración de servidores Windows.',
    type: 'script',
    icon: FileCode,
    tags: ['PowerShell', 'Windows'],
  },
  {
    id: '2',
    title: 'Docker Compose — Stack Homelab',
    description: 'Plantillas Docker Compose para servicios comunes del homelab.',
    type: 'docker',
    icon: Container,
    tags: ['Docker', 'Homelab'],
  },
  {
    id: '3',
    title: 'Plantillas Word — Documentación TI',
    description: 'Plantillas profesionales para documentación técnica.',
    type: 'template',
    icon: FileText,
    tags: ['Word', 'Documentación'],
  },
  {
    id: '4',
    title: 'Excel — Inventario de Activos',
    description: 'Hoja de cálculo para gestión de inventario de equipos.',
    type: 'template',
    icon: FileSpreadsheet,
    tags: ['Excel', 'Inventario'],
  },
];

export default function ResourcesPage() {
  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <h1 className="section-title">Recursos</h1>
          <p className="section-subtitle">
            Descargas gratuitas: scripts, plantillas, Docker Compose y más.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <StaggerItem key={resource.id}>
                <article className="glass-card group p-6 hover-lift">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-3">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold">{resource.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resource.tags.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-xs text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="mt-4 inline-flex items-center gap-2 text-sm text-accent transition-colors hover:text-accent/80"
                        disabled
                      >
                        <Download className="h-4 w-4" />
                        Próximamente
                      </button>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
}
