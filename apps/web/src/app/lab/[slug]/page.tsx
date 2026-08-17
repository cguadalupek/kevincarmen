import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, FlaskConical } from 'lucide-react';
import { getLabExperimentBySlug } from '@/lib/api/lab';

const STATUS = { IN_PROGRESS: ['En pruebas', 'border-blue-400/30 bg-blue-500/10 text-blue-300'], SUCCESS: ['Funcionó', 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'], PARTIAL: ['Funcionó con limitaciones', 'border-amber-400/30 bg-amber-500/10 text-amber-300'], FAILED: ['No funcionó', 'border-red-400/30 bg-red-500/10 text-red-300'], ABANDONED: ['Abandonado', 'border-zinc-400/30 bg-zinc-500/10 text-zinc-300'] } as const;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const experiment = await getLabExperimentBySlug((await params).slug);
  if (!experiment) return { title: 'Experimento no encontrado' };
  return { title: experiment.title, description: experiment.description, openGraph: { title: experiment.title, description: experiment.description, images: experiment.coverImage ? [experiment.coverImage] : undefined } };
}

function Block({ title, content }: { title: string; content: string | null }) { if (!content) return null; return <section className="glass-card p-5"><h2 className="mb-3 font-mono text-sm uppercase tracking-wider text-accent">{title}</h2><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{content}</p></section>; }

export default async function LabExperimentPage({ params }: Props) {
  const experiment = await getLabExperimentBySlug((await params).slug); if (!experiment) notFound();
  const [statusLabel, statusClass] = STATUS[experiment.status];
  return <article className="py-12"><div className="section-container max-w-5xl"><Link href="/lab" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"><ArrowLeft className="h-4 w-4" /> Lab</Link><header><div className="flex flex-wrap items-center gap-3"><span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClass}`}>{statusLabel}</span><span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{new Date(experiment.startedAt ?? experiment.createdAt).toLocaleDateString('es-ES')}</span></div><h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{experiment.title || 'Experimento legacy'}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{experiment.description}</p>{experiment.stack.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{experiment.stack.map((tech) => <span key={tech} className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">{tech}</span>)}</div>}</header>{experiment.coverImage ? <div className="relative mt-10 aspect-[21/9] overflow-hidden rounded-2xl border border-border"><Image src={experiment.coverImage} alt={experiment.title} fill priority className="object-cover" sizes="100vw" /></div> : <div className="mt-10 flex aspect-[21/9] items-center justify-center rounded-2xl border border-border bg-muted/30"><FlaskConical className="h-16 w-16 text-accent/40" /></div>}<div className="mt-10 grid gap-5 md:grid-cols-2"><Block title="Objetivo" content={experiment.objective} /><Block title="Hipótesis" content={experiment.hypothesis} /><Block title="Entorno" content={experiment.environment} /><Block title="Procedimiento" content={experiment.procedure} /><section className={`glass-card p-5 ${statusClass}`}><h2 className="mb-3 font-mono text-sm uppercase tracking-wider">Resultado · {statusLabel}</h2><p className="whitespace-pre-wrap text-sm leading-7 text-current/80">{experiment.result || 'Resultado pendiente de documentar.'}</p></section><Block title="Conclusión" content={experiment.conclusion} /></div></div></article>;
}
