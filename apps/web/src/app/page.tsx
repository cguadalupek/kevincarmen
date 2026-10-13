import { HeroSection } from '@/components/home/hero-section';
import { TechSection } from '@/components/home/tech-section';
import { ProjectsSection } from '@/components/home/projects-section';
import { ArticlesSection } from '@/components/home/articles-section';
import { VideosSection } from '@/components/home/videos-section';
import { TimelineSection } from '@/components/home/timeline-section';
import { ContactSection } from '@/components/home/contact-section';
import { getPublishedPosts } from '@/lib/api/posts';
import { getPublishedTimelineEvents } from '@/lib/api/timeline';
import { getPublishedProjects } from '@/lib/api/projects';
import { getSiteContent, getTechCategories } from '@/lib/api/site';
import { siteConfig, techStack } from '@kevincarmen/config';
import type { SiteHero, PublicTechCategory } from '@/lib/api/site';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/** Fallback al contenido estático previo si la API no responde. */
const FALLBACK_HERO: SiteHero = {
  name: siteConfig.name,
  tagline: siteConfig.tagline,
  roles: [...siteConfig.roles],
  description:
    'Desarrollo software, administro infraestructura, enseño tecnología y creo contenido. Construyendo soluciones que escalan.',
};

function fallbackTech(): PublicTechCategory[] {
  const categories = [...new Set(techStack.map((t) => t.category))];
  return categories.map((name, index) => ({
    id: `fallback-${index}`,
    name,
    position: index,
    items: techStack
      .filter((t) => t.category === name)
      .map((t, i) => ({ id: `fallback-${index}-${i}`, name: t.name, position: i })),
  }));
}

export default async function HomePage() {
  const [posts, timeline, projects, site, tech] = await Promise.all([
    getPublishedPosts(),
    getPublishedTimelineEvents(),
    getPublishedProjects(),
    getSiteContent(),
    getTechCategories(),
  ]);

  const hero = site?.hero ?? FALLBACK_HERO;
  const categories = tech ?? fallbackTech();

  return (
    <>
      <HeroSection hero={hero} />
      <TechSection categories={categories} />
      <ProjectsSection projects={projects} />
      <ArticlesSection posts={posts} />
      <VideosSection />
      <TimelineSection events={timeline} />
      <ContactSection />
    </>
  );
}