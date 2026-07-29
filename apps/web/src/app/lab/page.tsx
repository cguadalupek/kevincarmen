import type { Metadata } from 'next';
import {
  Cloud,
  Container,
  Film,
  HardDrive,
  LayoutDashboard,
  Music,
  Server,
  Box,
  type LucideIcon,
} from 'lucide-react';
import type { LabService } from '@kevincarmen/types';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Homelab',
  description: 'Mi laboratorio personal: servicios self-hosted, virtualización y contenedores.',
};

const labServices: (Omit<LabService, 'icon'> & { icon: LucideIcon })[] = [
  {
    id: '1',
    name: 'Proxmox',
    slug: 'proxmox',
    description: 'Hypervisor para virtualización de VMs y contenedores LXC.',
    stack: ['Proxmox VE', 'ZFS', 'Linux'],
    status: 'online',
    icon: Server,
  },
  {
    id: '2',
    name: 'Docker',
    slug: 'docker',
    description: 'Orquestación de contenedores para servicios y aplicaciones.',
    stack: ['Docker', 'Docker Compose', 'Portainer'],
    status: 'online',
    icon: Container,
  },
  {
    id: '3',
    name: 'OpenMediaVault',
    slug: 'omv',
    description: 'NAS basado en Debian para almacenamiento en red.',
    stack: ['OMV', 'MergerFS', 'SnapRAID'],
    status: 'online',
    icon: HardDrive,
  },
  {
    id: '4',
    name: 'Immich',
    slug: 'immich',
    description: 'Alternativa self-hosted a Google Photos con backup automático.',
    stack: ['Immich', 'PostgreSQL', 'Redis'],
    status: 'online',
    icon: Cloud,
  },
  {
    id: '5',
    name: 'Jellyfin',
    slug: 'jellyfin',
    description: 'Servidor multimedia para películas, series y música.',
    stack: ['Jellyfin', 'FFmpeg', 'Hardware Transcoding'],
    status: 'online',
    icon: Film,
  },
  {
    id: '6',
    name: 'Navidrome',
    slug: 'navidrome',
    description: 'Streaming de música personal con soporte Subsonic.',
    stack: ['Navidrome', 'Docker'],
    status: 'online',
    icon: Music,
  },
  {
    id: '7',
    name: 'Nextcloud',
    slug: 'nextcloud',
    description: 'Nube privada para archivos, calendario y colaboración.',
    stack: ['Nextcloud', 'MariaDB', 'Redis'],
    status: 'online',
    icon: Cloud,
  },
  {
    id: '8',
    name: 'Minecraft',
    slug: 'minecraft',
    description: 'Servidor de Minecraft para la comunidad.',
    stack: ['Paper MC', 'Docker', 'Plugins'],
    status: 'online',
    icon: Box,
  },
  {
    id: '9',
    name: 'Grafana',
    slug: 'grafana',
    description: 'Monitoreo y visualización de métricas del homelab.',
    stack: ['Grafana', 'Prometheus', 'Node Exporter'],
    status: 'online',
    icon: LayoutDashboard,
  },
];

const statusColors = {
  online: 'bg-accent/10 text-accent',
  offline: 'bg-red-500/10 text-red-400',
  maintenance: 'bg-yellow-500/10 text-yellow-400',
};

export default function LabPage() {
  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <h1 className="section-title">Homelab</h1>
          <p className="section-subtitle">
            Infraestructura personal self-hosted. Virtualización, contenedores y servicios 24/7.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {labServices.map((service) => {
            const Icon = service.icon;
            return (
              <StaggerItem key={service.id}>
                <article className="glass-card p-6 hover-lift">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-5 w-5 text-accent" />
                      </div>
                      <h2 className="font-semibold">{service.name}</h2>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        statusColors[service.status],
                      )}
                    >
                      {service.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
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
                </article>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </div>
  );
}
