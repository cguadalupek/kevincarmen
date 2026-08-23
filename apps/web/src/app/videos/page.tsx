import type { Metadata } from 'next';
import { Youtube } from 'lucide-react';
import { getLatestVideos } from '@/lib/api/posts';
import { YoutubeGrid } from '@/components/content/youtube-grid';

export const metadata: Metadata = {
  title: 'Videos',
  description: 'Todos los videos publicados por Kevin Carmen.',
  alternates: { canonical: '/videos' },
};

export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const videos = await getLatestVideos(500);
  return (
    <div className="py-16">
      <div className="section-container">
        <div className="flex items-center gap-3 text-accent"><Youtube className="h-6 w-6" /><span className="font-mono text-sm">/ videos</span></div>
        <h1 className="section-title mt-3">Videos publicados</h1>
        <p className="section-subtitle">Explora todos los videos añadidos desde el panel de contenido.</p>
        <YoutubeGrid videos={videos} />
      </div>
    </div>
  );
}
