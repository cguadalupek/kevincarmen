'use client';

import { timeline } from '@/lib/data/mock';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { cn } from '@/lib/utils';

const typeColors = {
  education: 'border-accent/50 bg-accent/5',
  work: 'border-primary/50 bg-primary/5',
  project: 'border-accent/50 bg-accent/5',
  achievement: 'border-muted-foreground/30 bg-muted/30',
};

export function TimelineSection() {
  return (
    <section className="py-20" id="timeline">
      <div className="section-container">
        <FadeIn>
          <h2 className="section-title">Timeline</h2>
          <p className="section-subtitle">Mi recorrido profesional y proyectos más relevantes.</p>
        </FadeIn>

        <div className="relative mt-12">
          <div
            className="absolute left-4 top-0 h-full w-px bg-border sm:left-1/2 sm:-translate-x-px"
            aria-hidden="true"
          />

          <StaggerContainer className="space-y-8">
            {timeline.map((event, index) => (
              <StaggerItem key={event.id}>
                <div
                  className={cn(
                    'relative flex flex-col sm:flex-row',
                    index % 2 === 0 ? 'sm:flex-row-reverse' : '',
                  )}
                >
                  <div className="hidden sm:block sm:w-1/2" />
                  <div className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-accent bg-background sm:left-1/2" />
                  <div
                    className={cn(
                      'ml-10 sm:ml-0 sm:w-1/2',
                      index % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12',
                    )}
                  >
                    <article
                      className={cn('glass-card border-l-2 p-5 hover-lift', typeColors[event.type])}
                    >
                      <span className="font-mono text-sm font-medium text-accent">
                        {event.year}
                      </span>
                      <h3 className="mt-1 font-semibold">{event.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    </article>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
