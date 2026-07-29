'use client';

import Link from 'next/link';
import { ArrowUpRight, Play, Youtube } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import { latestVideos } from '@/lib/data/mock';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';

export function VideosSection() {
  return (
    <section className="py-20" id="videos">
      <div className="section-container">
        <FadeIn>
          <h2 className="section-title">Últimos videos</h2>
          <p className="section-subtitle">
            Contenido educativo sobre desarrollo, infraestructura y homelab.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latestVideos.map((video) => (
            <StaggerItem key={video.id}>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <article className="glass-card overflow-hidden hover-lift">
                  <div className="relative flex aspect-video items-center justify-center bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 backdrop-blur-sm transition-transform group-hover:scale-110">
                      <Play className="h-6 w-6 fill-accent text-accent" />
                    </div>
                    <Youtube className="absolute bottom-3 right-3 h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="p-5">
                    <time
                      dateTime={video.publishedAt}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDate(video.publishedAt)}
                    </time>
                    <h3 className="mt-1 font-semibold transition-colors group-hover:text-accent">
                      {video.title}
                    </h3>
                  </div>
                </article>
              </a>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn className="mt-8 text-center">
          <Link
            href={process.env.NEXT_PUBLIC_YOUTUBE_URL ?? 'https://youtube.com'}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-accent"
          >
            Ver canal de YouTube
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
