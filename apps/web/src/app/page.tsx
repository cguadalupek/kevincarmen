import { HeroSection } from '@/components/home/hero-section';
import { TechSection } from '@/components/home/tech-section';
import { ProjectsSection } from '@/components/home/projects-section';
import { ArticlesSection } from '@/components/home/articles-section';
import { VideosSection } from '@/components/home/videos-section';
import { TimelineSection } from '@/components/home/timeline-section';
import { ContactSection } from '@/components/home/contact-section';
import { getPublishedPosts } from '@/lib/api/posts';
import { getPublishedTimelineEvents } from '@/lib/api/timeline';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function HomePage() {
  const [posts, timeline] = await Promise.all([
    getPublishedPosts(),
    getPublishedTimelineEvents(),
  ]);

  return (
    <>
      <HeroSection />
      <TechSection />
      <ProjectsSection />
      <ArticlesSection posts={posts} />
      <VideosSection />
      <TimelineSection events={timeline} />
      <ContactSection />
    </>
  );
}
