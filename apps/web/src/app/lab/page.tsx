import type { Metadata } from 'next';
import {
  Cloud,
  Container,
  Cpu,
  Film,
  HardDrive,
  LayoutDashboard,
  Music,
  Server,
  Box,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import type { PublicLabService } from '@/lib/api/posts';
import { getPublishedLabServices } from '@/lib/api/posts';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Homelab',
  description: 'Mi laboratorio personal: servicios self-hosted, virtualización y contenedores.',
};

const ICON_MAP: Record<string, LucideIcon> = {
  Server,
  Container,
  HardDrive,
  Cloud,
  Film,
  Music,
  Box,
  LayoutDashboard,
  Cpu,
  Wifi,
};

const statusColors = {
  ONLINE: 'bg-accent/10 text-accent',
  OFFLINE: 'bg-red-500/10 text-red-400',
  MAINTENANCE: 'bg-yellow-500/10 text-yellow-400',
};

export default async function LabPage() {
  const services: PublicLabService[] = await getPublishedLabServices();

  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <h1 className="section-title">Homelab</h1>
          <p className="section-subtitle">
            Infraestructura personal self-hosted. Virtualización, contenedores y servicios 24/7.
          </p>
        </FadeIn>

        {services.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            Aún no hay servicios publicados en el homelab.
          </div>
        ) : (
          <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const IconComponent: LucideIcon = (service.icon && ICON_MAP[service.icon]) || Server;
              const cardClass = 'glass-card block p-6 hover-lift';
              const inner = (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <IconComponent className="h-5 w-5 text-accent" />
                      </div>
                      <h2 className="font-semibold">{service.name}</h2>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        statusColors[service.status],
                      )}
                    >
                      {service.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  {service.stack.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.stack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );
              return (
                <StaggerItem key={service.id}>
                  {service.url ? (
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClass}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className={cardClass}>{inner}</div>
                  )}
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}