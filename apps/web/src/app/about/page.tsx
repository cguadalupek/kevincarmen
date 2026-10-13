import type { Metadata } from 'next';
import { siteConfig } from '@kevincarmen/config';
import { Logo } from '@/components/brand/logo';
import { FadeIn } from '@/components/motion/fade-in';
import Link from 'next/link';
import { getSiteContent } from '@/lib/api/site';
import type { SiteAbout, SiteHero } from '@/lib/api/site';

export const metadata: Metadata = {
  title: 'Sobre mí',
  description: 'Conoce más sobre Kevin Carmen: desarrollador, profesor y creador de contenido.',
  alternates: { canonical: '/sobre-mi' },
};

const FALLBACK_HERO: SiteHero = {
  name: siteConfig.name,
  tagline: siteConfig.tagline,
  roles: [...siteConfig.roles],
  description: '',
};

const FALLBACK_ABOUT: SiteAbout = {
  bio: [
    'Soy profesor de computación, analista TI, administrador de servidores y desarrollador. Me apasiona la tecnología en todas sus formas: desde escribir código hasta montar infraestructura self-hosted en mi homelab.',
    'Creo contenido educativo en YouTube y TikTok, comparto recursos open source y construyo herramientas que resuelven problemas reales. Esta plataforma es mi ecosistema personal: un lugar donde convergen mi blog, portfolio, laboratorio y formación.',
  ],
  expertise: [
    'Next.js',
    'TypeScript',
    'Docker',
    'Proxmox',
    'NestJS',
    'Tailwind CSS',
    'Nginx',
    'Linux',
  ],
  nowTitle: 'Lo que estoy haciendo ahora',
  nowItems: [
    'Desarrollando KevinCarmen.xyz con CMS, blog, portfolio y homelab.',
    'Creando contenido sobre homelab, Docker y administración de servidores.',
    'Preparando material para un curso de Next.js Full Stack.',
  ],
};

export default async function AboutPage() {
  const site = await getSiteContent();
  const hero = site?.hero ?? FALLBACK_HERO;
  const about = site?.about ?? FALLBACK_ABOUT;

  return (
    <div className="py-16">
      <div className="section-container max-w-3xl">
        <FadeIn>
          <div className="mb-8 flex items-center gap-6">
            <Logo size={64} />
            <div>
              <h1 className="text-3xl font-bold">{hero.name}</h1>
              <p className="mt-1 text-accent">{hero.tagline}</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="prose prose-invert max-w-none">
            {about.bio.map((paragraph, index) => (
              <p key={index} className="text-muted-foreground">
                {paragraph}
              </p>
            ))}
            <h2 className="mt-8 text-xl font-semibold">Áreas de expertise</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {about.expertise.map((tag) => (
                <li
                  key={tag}
                  className="rounded-lg border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-12" id="ahora">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold">{about.nowTitle}</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {about.nowItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <Link href="/contacto" className="mt-5 inline-block text-sm text-accent hover:underline">
              Hablemos sobre un proyecto
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}