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

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function HomePage() {
  const [posts, timeline, projects] = await Promise.all([
    getPublishedPosts(),
    getPublishedTimelineEvents(),
    getPublishedProjects(),
  ]);

  return (
    <>
      <HeroSection />
      <TechSection />
      <ProjectsSection projects={projects} />
      <ArticlesSection posts={posts} />
      <VideosSection />
      <TimelineSection events={timeline} />
      <ContactSection />
    </>
  );
}
