import { siteConfig } from '@kevincarmen/config';
import type { SiteAuthor } from '@/lib/api/site';

/** Bio por defecto si el CMS todavía no tiene una guardada (Configuración › Autor). */
export const AUTHOR_BIO_FALLBACK =
  'Software Developer & SysAdmin. Apasionado por la infraestructura, Linux, contenedores y homelabs.';

export interface AuthorLink {
  key: 'github' | 'linkedin' | 'x';
  label: string;
  href: string;
}

export interface AuthorProfile {
  name: string;
  bio: string;
  avatar: string | null;
  links: AuthorLink[];
}

/**
 * Resuelve el autor que se pinta en el artículo.
 *
 * Prioridad: contenido del CMS (`GET /site` → keys `author.*` y `social.*`,
 * editables en Configuración) › autor del propio artículo en la BD
 * (`users.name/avatar/bio`) › `siteConfig` del repo. Las redes solo se pintan
 * si tienen URL: una red sin configurar no deja un enlace roto.
 */
export function resolveAuthor(
  author: SiteAuthor | null | undefined,
  postAuthor?: { name?: string | null; avatar?: string | null; bio?: string | null } | null,
): AuthorProfile {
  const social = siteConfig.social as Record<string, string | undefined>;

  const candidates: AuthorLink[] = [
    { key: 'github', label: 'GitHub', href: pick(author?.links?.github, social.github) },
    { key: 'linkedin', label: 'LinkedIn', href: pick(author?.links?.linkedin, social.linkedin) },
    { key: 'x', label: 'X', href: pick(author?.links?.twitter, social.twitter) },
  ];
  const links = candidates.filter((link) => link.href.length > 0);

  return {
    name: pick(author?.name, postAuthor?.name ?? siteConfig.author),
    bio: pick(author?.bio, postAuthor?.bio ?? AUTHOR_BIO_FALLBACK),
    avatar: pick(author?.avatar, postAuthor?.avatar ?? undefined) || null,
    links,
  };
}

function pick(primary?: string | null, fallback?: string | null): string {
  const value = primary?.trim();
  if (value) return value;
  return fallback?.trim() ?? '';
}
