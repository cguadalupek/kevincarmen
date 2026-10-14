'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, FolderKanban, Layers, X } from 'lucide-react';
import { PortfolioCard } from '@/components/portfolio-card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { Pagination } from '@/components/ui/pagination';
import type { ProjectCategoryOption, PublicProject } from '@/lib/api/projects';
import { cn } from '@/lib/utils';

interface ProjectsFilterProps {
  projects: PublicProject[];
  /** Clasificaciones creadas en el panel (ordenadas por `position`). */
  categories: ProjectCategoryOption[];
}

/**
 * Proyectos por página. Eran 6 (3 filas de 2 columnas): con 4 el listado respira,
 * la paginación se ve sin hacer scroll largo y la última fila no queda coja.
 */
const PAGE_SIZE = 4;

const ALL = 'todas';

function mapProjectStatus(status: PublicProject['status']) {
  return {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
    IN_PROGRESS: 'in-progress',
  }[status] as 'active' | 'completed' | 'archived' | 'in-progress';
}

/** Nombre de la clasificación de un proyecto (relación nueva o texto antiguo). */
function categoryName(project: PublicProject): string | null {
  return project.projectCategory?.name ?? project.category ?? null;
}

export function ProjectsFilter({ projects, categories }: ProjectsFilterProps) {
  const [selected, setSelected] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Opciones del filtro: sólo las clasificaciones que TIENEN proyectos publicados
   * (una opción que lleva a «no hay nada» es un callejón sin salida) y en el orden
   * que define el panel (`position`). Los nombres sueltos que no existen en la
   * taxonomía (proyectos antiguos) se añaden al final por número de proyectos.
   */
  const options = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      const name = categoryName(project);
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const rank = new Map(categories.map((category, index) => [category.name, index]));

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, known: rank.has(name) }))
      .sort((a, b) => {
        if (a.known !== b.known) return a.known ? -1 : 1;
        if (a.known && b.known) return rank.get(a.name)! - rank.get(b.name)!;
        return b.count - a.count || a.name.localeCompare(b.name, 'es');
      });
  }, [projects, categories]);

  // Si la clasificación activa desaparece (se renombró o se quedó sin proyectos),
  // el filtro vuelve solo a «Todas» en vez de dejar la lista vacía.
  useEffect(() => {
    if (selected !== ALL && !options.some((option) => option.name === selected)) {
      setSelected(ALL);
    }
  }, [options, selected]);

  useEffect(() => {
    setPage(1);
  }, [selected]);

  // Cerrar con Escape o con un clic fuera del panel.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const visible = useMemo(
    () =>
      selected === ALL ? projects : projects.filter((project) => categoryName(project) === selected),
    [projects, selected],
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeOption = options.find((option) => option.name === selected);

  return (
    <div className="mt-8">
      {/* ── filtro: un desplegable en vez de una fila de fichas que desbordaba ── */}
      {options.length > 0 && (
        <FadeIn className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div ref={dropdownRef} className="relative w-full sm:w-80">
            <span
              id="filtro-clasificacion"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              <FolderKanban className="h-3.5 w-3.5" /> Clasificación
            </span>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-labelledby="filtro-clasificacion"
              className={cn(
                'flex h-11 w-full items-center gap-2 rounded-xl border px-3 text-left text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
                open || selected !== ALL
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-card/60 text-muted-foreground hover:border-accent/50 hover:text-foreground',
              )}
            >
              <span className="min-w-0 flex-1 truncate font-medium">
                {selected === ALL ? 'Todas las clasificaciones' : selected}
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {visible.length}
              </span>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
              />
            </button>

            {open && (
              <ul
                role="listbox"
                aria-labelledby="filtro-clasificacion"
                className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-2xl thin-scrollbar"
              >
                <FilterOption
                  label="Todas las clasificaciones"
                  count={projects.length}
                  active={selected === ALL}
                  onSelect={() => {
                    setSelected(ALL);
                    setOpen(false);
                  }}
                />
                {options.map((option) => (
                  <FilterOption
                    key={option.name}
                    label={option.name}
                    count={option.count}
                    active={selected === option.name}
                    onSelect={() => {
                      setSelected(option.name);
                      setOpen(false);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>

          {selected !== ALL && activeOption && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:pb-1">
              <Layers className="h-3.5 w-3.5 text-accent" />
              <span className="min-w-0 truncate">
                Mostrando {visible.length} de {projects.length} proyectos
              </span>
              <button
                type="button"
                onClick={() => setSelected(ALL)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 font-medium transition-colors hover:border-accent hover:text-accent"
              >
                <X className="h-3 w-3" /> Quitar filtro
              </button>
            </div>
          )}
        </FadeIn>
      )}

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
          No hay proyectos en esta clasificación todavía.
        </div>
      )}
    </div>
  );
}

/** Fila del desplegable: etiqueta + cuántos proyectos tiene. */
function FilterOption({
  label,
  count,
  active,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
          active ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <span className="flex w-4 shrink-0 justify-center">
          {active && <Check className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]">
          {count}
        </span>
      </button>
    </li>
  );
}
