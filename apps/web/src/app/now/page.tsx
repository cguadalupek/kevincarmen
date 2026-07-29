import type { Metadata } from 'next';
import { siteConfig } from '@kevincarmen/config';
import { FadeIn } from '@/components/motion/fade-in';

export const metadata: Metadata = {
  title: 'Now',
  description: 'En qué estoy trabajando actualmente.',
};

const currentFocus = [
  {
    title: 'Desarrollando KevinCarmen.xyz',
    description: 'Plataforma personal completa con CMS, blog, portfolio y homelab.',
    status: 'active',
  },
  {
    title: 'Contenido en YouTube',
    description: 'Videos sobre homelab, Docker y administración de servidores.',
    status: 'active',
  },
  {
    title: 'Curso de Next.js Full Stack',
    description: 'Preparando material de formación estructurado.',
    status: 'active',
  },
];

export default function NowPage() {
  return (
    <div className="py-16">
      <div className="section-container max-w-2xl">
        <FadeIn>
          <h1 className="section-title">Now</h1>
          <p className="section-subtitle">
            Inspirado en la{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Now Page movement
            </a>
            . Esto es lo que estoy haciendo ahora mismo.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Última actualización: julio 2026
          </p>
        </FadeIn>

        <div className="mt-12 space-y-6">
          {currentFocus.map((item, index) => (
            <FadeIn key={item.title} delay={index * 0.1}>
              <article className="glass-card p-6 hover-lift">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent animate-glow" />
                  <div>
                    <h2 className="font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="mt-12 text-sm text-muted-foreground">
          <p>
            Si quieres contactarme, escríbeme a{' '}
            <a href={`mailto:${siteConfig.email}`} className="text-accent hover:underline">
              {siteConfig.email}
            </a>
          </p>
        </FadeIn>
      </div>
    </div>
  );
}
