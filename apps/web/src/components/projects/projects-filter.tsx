'use client';

import { useEffect, useMemo, useState } from 'react';
import { PortfolioCard } from '@/components/portfolio-card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { Pagination } from '@/components/ui/pagination';
import type { PublicProject } from '@/lib/api/projects';

interface ProjectsFilterProps {
  projects: PublicProject[];
}

const PAGE_SIZE = 6;

const CHIP_BASE =
  'shrink-0 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent';
const CHIP_ACTIVE = 'border-accent bg-accent/15 text-accent';
const CHIP_IDLE =
  'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200';

function mapProjectStatus(status: PublicProject['status']) {
  return {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
    IN_PROGRESS: 'in-progress',
  }[status] as 'active' | 'completed' | 'archived' | 'in-progress';
}

export function ProjectsFilter({ projects }: ProjectsFilterProps) {
  const [selected, setSelected] = useState('todos');
  const [page, setPage] = useState(1);

  // Categorías presentes entre los proyectos publicados, con su conteo.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      if (!project.category) continue;
      counts.set(project.category, (counts.get(project.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [projects]);

  const visible = useMemo(
    () => (selected === 'todos' ? projects : projects.filter((p) => p.category === selected)),
    [projects, selected],
  );

  // Al cambiar de categoría vuelve a la primera página.
  useEffect(() => {
    setPage(1);
  }, [selected]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mt-10">
      <FadeIn>
        <nav
          aria-label="Subsecciones de proyectos"
          className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          <button
            type="button"
            onClick={() => setSelected('todos')}
            aria-current={selected === 'todos' ? 'page' : undefined}
            className={`${CHIP_BASE} ${selected === 'todos' ? CHIP_ACTIVE : CHIP_IDLE}`}
          >
            Todos <span className="ml-1 text-xs opacity-70">{projects.length}</span>
          </button>
          {categories.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelected(name)}
              aria-current={selected === name ? 'page' : undefined}
              className={`${CHIP_BASE} ${selected === name ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {name} <span className="ml-1 text-xs opacity-70">{count}</span>
            </button>
          ))}
        </nav>
      </FadeIn>

      {visible.length > 0 ? (
        <>
          <StaggerContainer
            className="mt-8 grid gap-6 md:grid-cols-2"
            key={`${selected}-${safePage}`}
          >
            {pageItems.map((project) => (
              <StaggerItem key={project.id}>
                <PortfolioCard
                  href={`/proyectos/${project.slug}`}
                  title={project.title}
                  description={project.description}
                  status={mapProjectStatus(project.status)}
                  stack={project.technologies}
                  repository={project.repository ?? undefined}
                  demo={project.demo ?? undefined}
                  coverImage={project.coverImage ?? undefined}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={visible.length}
            pageSize={PAGE_SIZE}
            label="proyectos"
            onChange={setPage}
          />
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
          No hay proyectos en esta categoría todavía.
        </div>
      )}
    </div>
  );
}
