import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  FlaskConical,
  FolderKanban,
  Play,
} from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import { siteConfig } from '@kevincarmen/config';
import { getLabExperimentBySlug, type ExperimentStatus } from '@/lib/api/lab';
import { MarkdownContent } from '@/components/blog/markdown-content';
import { VideoEmbed } from '@/components/blog/video-embed';
import { LabChapters } from '@/components/lab/chapters';
import { LabMilestones } from '@/components/lab/lab-milestones';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS = {
  IN_PROGRESS: ['En pruebas', 'border-blue-400/30 bg-blue-500/10 text-blue-300'],
  SUCCESS: ['Funcionó', 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'],
  PARTIAL: ['Funcionó con limitaciones', 'border-amber-400/30 bg-amber-500/10 text-amber-300'],
  FAILED: ['No funcionó', 'border-red-400/30 bg-red-500/10 text-red-300'],
  ABANDONED: ['Abandonado', 'border-zinc-400/30 bg-zinc-500/10 text-zinc-300'],
} as const;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const experiment = await getLabExperimentBySlug((await params).slug);
  if (!experiment) return { title: 'Experimento no encontrado' };
  return {
    title: experiment.title,
    description: experiment.description,
    openGraph: {
      title: experiment.title,
      description: experiment.description,
      type: 'article',
      images: experiment.coverImage ? [{ url: experiment.coverImage }] : undefined,
    },
    alternates: { canonical: `/lab/${experiment.slug}` },
  };
}

export default async function LabExperimentPage({ params }: Props) {
  const experiment = await getLabExperimentBySlug((await params).slug);
  if (!experiment) notFound();

  const [statusLabel, statusClass] = STATUS[experiment.status as ExperimentStatus];
  const hasVideo = Boolean(experiment.videoUrl);
  const dateLabel =
    experiment.startedAt || experiment.completedAt
      ? `${experiment.startedAt ? formatDate(experiment.startedAt) : ''}${experiment.startedAt && experiment.completedAt ? ' → ' : ''}${experiment.completedAt ? formatDate(experiment.completedAt) : ''}`
      : null;

  return (
    <article className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: experiment.title,
            description: experiment.description,
            mainEntityOfPage: `${siteConfig.url}/lab/${experiment.slug}`,
            datePublished: experiment.createdAt,
            dateModified: experiment.updatedAt,
            author: { '@type': 'Person', name: siteConfig.name },
            image: experiment.coverImage ? `${siteConfig.url}${experiment.coverImage}` : undefined,
          }),
        }}
      />
      <div className="section-container max-w-5xl">
        <Link
          href="/lab"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Laboratorio
        </Link>

        <header>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            {dateLabel && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /> {dateLabel}
              </span>
            )}
            {hasVideo && experiment.videoDuration && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                <Play className="h-4 w-4" /> {experiment.videoDuration} min en video
              </span>
            )}
            {experiment.readingTime > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {experiment.readingTime} min de lectura
              </span>
            )}
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {experiment.title || 'Experimento legacy'}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            {experiment.description}
          </p>
          {experiment.stack.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {experiment.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </header>

        {experiment.coverImage ? (
          <div className="relative mt-10 aspect-[21/9] overflow-hidden rounded-2xl border border-border">
            <Image
              src={experiment.coverImage}
              alt={experiment.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
              unoptimized
            />
          </div>
        ) : (
          <div className="mt-10 flex aspect-[21/9] items-center justify-center rounded-2xl border border-border bg-muted/30">
            <FlaskConical className="h-16 w-16 text-accent/40" />
          </div>
        )}

        <LabMilestones milestones={experiment.milestones} />

        {hasVideo && (
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <VideoEmbed src={experiment.videoUrl!} title={experiment.title} />
            </div>
            {experiment.chapters.length > 0 ? (
              <LabChapters chapters={experiment.chapters} videoUrl={experiment.videoUrl!} />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Video largo con la explicación completa.
              </div>
            )}
          </div>
        )}

        {experiment.content ? (
          <MarkdownContent content={experiment.content} title={experiment.title} />
        ) : (
          <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            El desarrollo completo de este experimento se está documentando. Vuelve pronto.
          </div>
        )}

        {experiment.gallery.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-wider text-accent">
              Evidencias
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {experiment.gallery.map((url) => (
                <div
                  key={url}
                  className="relative aspect-video overflow-hidden rounded-xl border border-border"
                >
                  <Image
                    src={url}
                    alt="Evidencia del experimento"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {(experiment.relatedPost || experiment.relatedProject) && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-wider text-accent">
              Sigue explorando
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {experiment.relatedPost && (
                <Link
                  href={`/blog/${experiment.relatedPost.slug}`}
                  className="glass-card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-accent/50"
                >
                  {experiment.relatedPost.coverImage ? (
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={experiment.relatedPost.coverImage}
                        alt={experiment.relatedPost.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                      <FileText className="h-6 w-6 text-accent/60" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">Artículo · /blog</p>
                    <p className="mt-1 line-clamp-2 font-semibold transition group-hover:text-accent">
                      {experiment.relatedPost.title}
                    </p>
                  </div>
                </Link>
              )}
              {experiment.relatedProject && (
                <Link
                  href={`/proyectos/${experiment.relatedProject.slug}`}
                  className="glass-card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-accent/50"
                >
                  {experiment.relatedProject.coverImage ? (
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={experiment.relatedProject.coverImage}
                        alt={experiment.relatedProject.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                      <FolderKanban className="h-6 w-6 text-accent/60" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">Proyecto · /proyectos</p>
                    <p className="mt-1 line-clamp-2 font-semibold transition group-hover:text-accent">
                      {experiment.relatedProject.title}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        {experiment.tags.length > 0 && (
          <footer className="mt-12 border-t border-border pt-8">
            <div className="flex flex-wrap gap-2">
              {experiment.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </div>
    </article>
  );
}
