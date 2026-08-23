'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioCardProps {
  href: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived' | 'in-progress';
  stack: string[];
  repository?: string;
  demo?: string;
  coverImage?: string;
}

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

export function PortfolioCard({
  href,
  title,
  description,
  status,
  stack,
  repository,
  demo,
  coverImage,
}: PortfolioCardProps) {
  return (
    <Link href={href} className="group block focus:outline-none">
      <article className="glass-card flex h-full flex-col overflow-hidden hover-lift">
        {coverImage && (
          <div className="relative aspect-video w-full overflow-hidden border-b border-border">
            <Image src={coverImage} alt={`Miniatura de ${title}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
          </div>
        )}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4 flex items-start justify-between">
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusColors[status],
              )}
            >
              {statusLabels[status]}
            </span>
            <div className="flex gap-2">
              {repository && (
                <button type="button" className="text-muted-foreground hover:text-accent" aria-label="Repositorio" onClick={(event) => { event.preventDefault(); event.stopPropagation(); window.open(repository, '_blank', 'noopener,noreferrer'); }}>
                  <Github className="h-4 w-4" />
                </button>
              )}
              {demo && (
                <button type="button" className="text-muted-foreground hover:text-accent" aria-label="Demo" onClick={(event) => { event.preventDefault(); event.stopPropagation(); window.open(demo, '_blank', 'noopener,noreferrer'); }}>
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <h2 className="text-xl font-semibold transition-colors group-hover:text-accent">
            {title}
          </h2>
          <p className="mt-3 flex-1 text-muted-foreground">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stack.map((tech) => (
              <span key={tech} className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
