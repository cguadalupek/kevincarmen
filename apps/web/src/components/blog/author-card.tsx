import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import { siteConfig } from '@kevincarmen/config';
import { AuthorAvatar } from '@/components/blog/author-avatar';
import type { AuthorLink, AuthorProfile } from '@/lib/blog/author';

const linkIcons = {
  github: Github,
  linkedin: Linkedin,
  x: Twitter,
} as const;

interface AuthorCardProps {
  author: AuthorProfile;
}

/**
 * Tarjeta de cierre del artículo: foto, nombre, bio corta y redes.
 * Los enlaces salen de `resolveAuthor` (CMS › Configuración › Autor y redes).
 */
export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <section aria-label="Sobre el autor" className="glass-card mt-12 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <AuthorAvatar name={author.name} src={author.avatar} size={56} className="sm:mt-0.5" />

        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">Escrito por</p>
          <p className="mt-1 text-lg font-semibold leading-tight">{author.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{author.bio}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {author.links.map((link) => (
              <AuthorLinkPill key={link.key} link={link} />
            ))}
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthorLinkPill({ link }: { link: AuthorLink }) {
  const Icon = linkIcons[link.key];
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${link.label} de ${siteConfig.author}`}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
    >
      <Icon className="h-3.5 w-3.5" />
      {link.label}
    </a>
  );
}
