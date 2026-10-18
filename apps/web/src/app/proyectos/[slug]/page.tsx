import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';
import { calculateReadingTime } from '@kevincarmen/utils';
import { getProjectBySlug } from '@/lib/api/projects';
import { getSiteContent } from '@/lib/api/site';
import { resolveAuthor } from '@/lib/blog/author';
import { extractHeadings } from '@/lib/blog/headings';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { AuthorBadge } from '@/components/blog/author-badge';
import { PostToc, PostTocFab } from '@/components/blog/post-toc';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return {
    title: project?.title ?? 'Proyecto',
    description: project?.description ?? 'Caso de estudio técnico',
    alternates: { canonical: `/proyectos/${slug}` },
  };
}

const statusLabels = {
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  IN_PROGRESS: 'En desarrollo',
  ARCHIVED: 'Archivado',
} as const;

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, site] = await Promise.all([getProjectBySlug(slug), getSiteContent()]);
  if (!project)
    return (
      <div className="section-container py-24">
        <h1 className="text-3xl font-bold">Proyecto no encontrado</h1>
        <Link href="/proyectos" className="mt-6 inline-flex text-accent">
          Volver a proyectos
        </Link>
      </div>
    );

  const author = resolveAuthor(site?.author);
  // Índice de la ficha: solo el cuerpo único (`content`); las secciones legacy
  // se pintan sin ids, así que no entran en la tabla de contenidos.
  const headings = extractHeadings(project.content ?? '');
  const readingTime =
    project.readingTime ?? calculateReadingTime(project.content ?? project.description ?? '');
  const resources = [
    { label: 'Repositorio', url: project.repository, icon: Github },
    { label: 'Demo', url: project.demo, icon: ExternalLink },
    { label: 'Documentación', url: project.documentation, icon: ExternalLink },
  ].filter((item) => item.url);

  return (
    <article className="py-16">
      <div className="section-container max-w-5xl">
        <Link
          href="/proyectos"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a proyectos
        </Link>
        <header>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">
              {statusLabels[project.status]}
            </span>
            {project.category && <span>{project.category}</span>}
            {project.projectYear && <span>{project.projectYear}</span>}
          </div>
          {/* Móvil: autor en una fila y fecha • lectura en otra (no se parten a media frase). */}
          <div className="mt-4 flex flex-col items-start gap-2 text-sm text-muted-foreground md:flex-row md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2">
            <AuthorBadge
              name={author.name}
              avatar={author.avatar}
              publishedAt={project.publishedAt}
              readingTime={readingTime}
            />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            {project.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
          {resources.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {resources.map(({ label, url, icon: Icon }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-accent hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
          )}
        </header>
        {project.coverImage && (
          <img
            src={project.coverImage}
            alt={`Portada de ${project.title}`}
            className="mt-10 aspect-[21/9] w-full rounded-2xl border border-border object-cover"
          />
        )}

        {/* Cuerpo + índice flotante: la columna de 13 rem solo aparece desde `lg`. */}
        <div className="mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-8 xl:gap-10">
          <div className="min-w-0">
            {/* Cuerpo único en Markdown (mismo formato que los artículos). */}
            {project.content ? (
              <MarkdownContent content={project.content} headings={headings} />
            ) : (
              <LegacySections project={project} />
            )}

            {project.gallery.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-2xl font-semibold">Galería</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.gallery.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`${project.title} · imagen ${i + 1}`}
                      className="w-full rounded-xl border border-border object-cover"
                    />
                  ))}
                </div>
              </section>
            )}

            <PostTocFab headings={headings} />
          </div>

          <PostToc headings={headings} label="En este proyecto" />
        </div>
      </div>
    </article>
  );
}

/** Fallback para proyectos guardados antes del editor único (campo `content` vacío). */
function LegacySections({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>;
}) {
  const decisions = project.technicalDecisions ?? [];
  const challenges = project.challenges ?? [];
  return (
    <div className="space-y-10">
      <ContentSection title="Descripción" content={project.longDescription} />
      <ContentSection title="Problema" content={project.problem} />
      <ContentSection title="Solución" content={project.solution} />
      <ContentSection title="Mi rol" content={project.role} />
      <section>
        {(project.architecture || project.architectureImage) && (
          <>
            <h2 className="mb-4 text-2xl font-semibold">Arquitectura</h2>
            {project.architecture && <MarkdownContent content={project.architecture} />}
            {project.architectureImage && (
              <img
                src={project.architectureImage}
                alt="Diagrama de arquitectura"
                className="mt-5 max-h-[600px] w-full rounded-xl border border-border object-contain"
              />
            )}
          </>
        )}
      </section>
      {decisions.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Decisiones técnicas</h2>
          <div className="space-y-4">
            {decisions.map((d, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/40 p-5">
                <h3 className="font-semibold text-accent">{d.title}</h3>
                <MarkdownContent content={d.description} />
              </div>
            ))}
          </div>
        </section>
      )}
      {challenges.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Desafíos</h2>
          <div className="space-y-4">
            {challenges.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/40 p-5">
                <h3 className="font-semibold text-accent">{c.title}</h3>
                <p className="mt-3 text-sm font-medium">Problema</p>
                <MarkdownContent content={c.problem} />
                <p className="mt-3 text-sm font-medium">Solución</p>
                <MarkdownContent content={c.solution} />
              </div>
            ))}
          </div>
        </section>
      )}
      <ContentSection title="Resultados" content={project.results} />
      <ContentSection title="Aprendizajes" content={project.learnings} />
    </div>
  );
}

function ContentSection({ title, content }: { title: string; content?: string | null }) {
  return content ? (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      <MarkdownContent content={content} />
    </section>
  ) : null;
}
