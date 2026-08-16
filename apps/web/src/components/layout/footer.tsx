import Link from 'next/link';
import { Github, Instagram, Linkedin, Music2, Youtube } from 'lucide-react';
import { contentNav, siteConfig } from '@kevincarmen/config';
import { Logo } from '@/components/brand/logo';

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
  instagram: Instagram,
};

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-card/30 backdrop-blur-sm">
      <div className="section-container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Logo size={32} showText />
            <p className="mt-4 text-sm text-muted-foreground">{siteConfig.tagline}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Navegación</h3>
            <ul className="grid grid-cols-2 gap-2">
              {[...siteConfig.nav, ...contentNav].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Redes</h3>
            <div className="flex gap-3">
              {Object.entries(siteConfig.social).map(([key, url]) => {
                const Icon = socialIcons[key as keyof typeof socialIcons];
                if (!Icon) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border p-2 text-muted-foreground transition-all hover:border-accent/50 hover:text-accent"
                    aria-label={key}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center border-t border-border pt-8">
          <p className="font-mono text-xs text-muted-foreground">
            Construido con Next.js · NestJS · Docker
          </p>
        </div>
      </div>
    </footer>
  );
}
