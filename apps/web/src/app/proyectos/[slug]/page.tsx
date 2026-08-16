import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, Github, ExternalLink } from 'lucide-react';
import { getPostBySlug } from '@/lib/api/posts';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { formatDate } from '@kevincarmen/utils';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ProjectInfo {
  title: string;
  description: string;
  stack: string[];
  status: 'En desarrollo' | 'En producción' | 'Estable';
  repo?: string;
  demo?: string;
  highlights: string[];
  content: string;
}

const DEMO_PROJECTS: Record<string, ProjectInfo> = {
  'kevincarmen-platform': {
    title: 'KevinCarmen.xyz',
    description:
      'Plataforma personal con CMS propio, blog, portafolio y homelab lab integrado.',
    stack: ['Next.js 15', 'NestJS 10', 'PostgreSQL', 'Docker', 'Cloudflare Tunnel'],
    status: 'En desarrollo',
    repo: 'https://github.com/cguadalupek/kevincarmen-platform',
    highlights: [
      'CMS completo con TipTap y datos estructurados.',
      'Despliegue continuo vía git push al LXC.',
      'Optimización SEO con datos estructurados.',
    ],
    content:
      'Proyecto principal de mi plataforma. Disponible en `kevincarmen.xyz`. Permite crear artículos en un editor WYSIWYG estilo Notion, gestionarlos y publicarlos automáticamente. Cada push al repositorio reconstruye los contenedores en el LXC.',
  },
  'homelab-stack': {
    title: 'Homelab Stack',
    description: 'Servicios self-hosted con Proxmox, Docker, Immich, Jellyfin y Grafana.',
    stack: ['Proxmox VE', 'Docker Compose', 'Nextcloud', 'Grafana', 'WireGuard'],
    status: 'En producción',
    repo: 'https://github.com/cguadalupek/homelab-stack',
    highlights: [
      'Cluster LXC con virtualización anidada.',
      'Backups automatizados con Borg y rclone.',
      'Monitoreo centralizado con Grafana + Prometheus.',
    ],
    content:
      'Infraestructura del laboratorio personal descrita paso a paso en la sección `/lab`. Documenta el aprovisionamiento de Proxmox, la red VLAN y el empaquetado de servicios con Docker Compose.',
  },
  'panel-scripts': {
    title: 'Panel Scripts',
    description: 'Colección de scripts para SysAdmins Windows/Linux con PowerShell y Bash.',
    stack: ['PowerShell', 'Bash', 'GitHub Actions'],
    status: 'Estable',
    repo: 'https://github.com/cguadalupek/panel-scripts',
    highlights: [
      'Inventario automatizado de equipos Windows.',
      'Reportes en CSV y JSON.',
      'Compatible con Intune y SCCM.',
    ],
    content:
      'Repositorio público con scripts listos para producción. Acompañado de documentación generada automáticamente y ejemplos de pipelines en CI.',
  },
  'womic-cms': {
    title: 'WO MIC',
    description: 'Plataforma de podcast técnico web con optimizaciones SEO automáticas.',
    stack: ['Next.js', 'Prisma', 'RSS', 'Cloudflare R2'],
    status: 'Estable',
    demo: 'https://kevincarmen.xyz/now',
    highlights: [
      'Generación automática de transcripts con Whisper.',
      'Feed RSS enriquecido y sitemap dinámico.',
    ],
    content:
      'Sitio temático donde publico episodios del micrófono. Próximamente abrirá su API pública para que otras plataformas embeban el contenido.',
  },
};

const DEFAULT_DESCRIPTION =
  'Información detallada de un proyecto personal. Esta página utiliza datos dummy porque el slug todavía no existe como artículo publicado.';

function toTitle(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fallback = DEMO_PROJECTS[slug];
  return {
    title: fallback?.title ?? toTitle(slug),
    description: fallback?.description ?? DEFAULT_DESCRIPTION,
    alternates: { canonical: `/proyectos/${slug}` },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const fallback = DEMO_PROJECTS[slug];
  const info: ProjectInfo =
    fallback ?? {
      title: toTitle(slug),
      description: DEFAULT_DESCRIPTION,
      stack: [],
      status: 'Estable',
      highlights: [],
      content:
        'Este proyecto todavía no tiene una entrada documentada en el blog. Pronto añadiremos más detalles aquí.',
    };

  return (
    <article className="py-16">
      <div className="section-container max-w-3xl">
        <Link
          href="/proyectos"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proyectos
        </Link>

        <header>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {post?.publishedAt && (
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            )}
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {info.status}
            </span>
            {post && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTime} min lectura
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{info.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{info.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {info.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>

          {(info.repo || info.demo) && (
            <div className="mt-6 flex gap-3">
              {info.repo && (
                <a
                  href={info.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent"
                >
                  <Github className="h-4 w-4" /> Repositorio
                </a>
              )}
              {info.demo && (
                <a
                  href={info.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent"
                >
                  <ExternalLink className="h-4 w-4" /> Demo
                </a>
              )}
            </div>
          )}
        </header>

        {info.highlights.length > 0 && (
          <section className="mt-12 rounded-xl border border-border bg-card/40 p-6">
            <h2 className="text-lg font-semibold text-accent">Características</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {info.highlights.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="prose prose-invert prose-accent mt-12 max-w-none">
          <h2>Descripción</h2>
          <p>{info.content}</p>
        </section>
      </div>
    </article>
  );
}
