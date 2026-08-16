import type { Metadata } from 'next';
import { featuredProjects } from '@/lib/data/mock';
import { PortfolioCard } from '@/components/portfolio-card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';

export const metadata: Metadata = {
  title: 'Proyectos',
  description: 'Portfolio de proyectos de desarrollo, infraestructura y open source.',
  alternates: { canonical: '/proyectos' },
};

export default function ProjectsPage() {
  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <h1 className="section-title">Portfolio</h1>
          <p className="section-subtitle">
            Proyectos de software, infraestructura y herramientas open source.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2">
          {featuredProjects.map((project) => (
            <StaggerItem key={project.id}>
              <PortfolioCard
                href={`/proyectos/${slugifyTitle(project.title)}`}
                title={project.title}
                description={project.description}
                status={project.status}
                stack={project.technologies}
                repository={project.repository}
                demo={project.demo}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  );
}

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
