'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import type { PublicTechCategory } from '@/lib/api/site';

export function TechSection({ categories }: { categories: PublicTechCategory[] }) {
  return (
    <section className="py-20" id="tecnologias">
      <div className="section-container">
        <FadeIn>
          <h2 className="section-title">Tecnologías</h2>
          <p className="section-subtitle">
            Stack tecnológico que utilizo para desarrollar, desplegar y mantener proyectos.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <StaggerItem key={category.id}>
              <div className="glass-card p-6 hover-lift">
                <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
                  {category.name}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((tech) => (
                    <li
                      key={tech.id}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {tech.name}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}