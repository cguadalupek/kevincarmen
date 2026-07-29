import type { Project, Video, TimelineEvent } from '@kevincarmen/types';

export const featuredProjects: Project[] = [
  {
    id: '1',
    title: 'KevinCarmen.xyz',
    slug: 'kevincarmen-platform',
    description:
      'Plataforma personal escalable con blog, CMS, portfolio, homelab y cursos. Monorepo con Next.js y NestJS.',
    technologies: ['Next.js', 'NestJS', 'PostgreSQL', 'Docker', 'Redis'],
    repository: 'https://github.com/kevincarmen/kevincarmen-platform',
    status: 'in-progress',
    featured: true,
    publishedAt: '2026-01-01',
  },
  {
    id: '2',
    title: 'Homelab Dashboard',
    slug: 'homelab-dashboard',
    description:
      'Panel de monitoreo centralizado para servicios self-hosted con Grafana, Prometheus y alertas.',
    technologies: ['Grafana', 'Prometheus', 'Docker', 'Proxmox'],
    status: 'active',
    featured: true,
    publishedAt: '2025-06-15',
  },
  {
    id: '3',
    title: 'Scripts de Automatización',
    slug: 'automation-scripts',
    description:
      'Colección de scripts PowerShell y Bash para administración de servidores Windows y Linux.',
    technologies: ['PowerShell', 'Bash', 'Docker'],
    repository: 'https://github.com/kevincarmen/scripts',
    status: 'active',
    featured: true,
    publishedAt: '2025-03-10',
  },
];

export const latestVideos: Video[] = [
  {
    id: '1',
    title: 'Tour por mi Homelab 2026',
    url: 'https://youtube.com',
    platform: 'youtube',
    publishedAt: '2026-07-15',
  },
  {
    id: '2',
    title: 'Docker Compose desde cero',
    url: 'https://youtube.com',
    platform: 'youtube',
    publishedAt: '2026-07-01',
  },
  {
    id: '3',
    title: 'Configurando Proxmox paso a paso',
    url: 'https://youtube.com',
    platform: 'youtube',
    publishedAt: '2026-06-20',
  },
];

export const timeline: TimelineEvent[] = [
  {
    id: '1',
    year: '2026',
    title: 'Lanzamiento de KevinCarmen.xyz',
    description: 'Inicio del desarrollo de la plataforma personal completa.',
    type: 'project',
  },
  {
    id: '2',
    year: '2025',
    title: 'Expansión del Homelab',
    description: 'Migración a Proxmox con servicios Docker self-hosted.',
    type: 'project',
  },
  {
    id: '3',
    year: '2024',
    title: 'Creador de Contenido',
    description: 'Inicio de canal educativo en YouTube y TikTok sobre tecnología.',
    type: 'achievement',
  },
  {
    id: '4',
    year: '2022',
    title: 'Profesor de Computación',
    description: 'Docencia en informática, programación y sistemas operativos.',
    type: 'work',
  },
  {
    id: '5',
    year: '2020',
    title: 'Analista TI',
    description: 'Administración de servidores, redes y soporte técnico empresarial.',
    type: 'work',
  },
];
