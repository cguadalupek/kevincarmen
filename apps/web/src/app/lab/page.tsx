import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, FlaskConical } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { getLabExperiments, type ExperimentStatus } from '@/lib/api/lab';

export const metadata: Metadata = { title: 'Experimentos del Lab', description: 'Pruebas, experimentos y descubrimientos técnicos documentados.' };

const STATUS = { IN_PROGRESS: ['En pruebas', 'bg-blue-500/10 text-blue-300'], SUCCESS: ['Funcionó', 'bg-emerald-500/10 text-emerald-300'], PARTIAL: ['Funcionó con limitaciones', 'bg-amber-500/10 text-amber-300'], FAILED: ['No funcionó', 'bg-red-500/10 text-red-300'], ABANDONED: ['Abandonado', 'bg-zinc-500/10 text-zinc-300'] } satisfies Record<ExperimentStatus, [string, string]>;

export default async function LabPage() {
  const experiments = await getLabExperiments();
  return <div className="py-16"><div className="section-container"><FadeIn><div className="flex items-center gap-3 text-accent"><FlaskConical className="h-6 w-6" /><span className="font-mono text-sm">/ technical experiments</span></div><h1 className="section-title mt-3">Experimentos del Lab</h1><p className="section-subtitle">Pruebas, experimentos y descubrimientos técnicos documentados.</p></FadeIn>
    {experiments.length === 0 ? <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">Aún no hay experimentos documentados.</div> : <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{experiments.map((experiment) => { const [label, color] = STATUS[experiment.status]; return <StaggerItem key={experiment.id}><Link href={`/lab/${experiment.slug}`} className="glass-card group block h-full overflow-hidden transition hover:-translate-y-1 hover:border-accent/50">{experiment.coverImage ? <div className="relative aspect-[16/9] overflow-hidden"><Image src={experiment.coverImage} alt={experiment.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" /></div> : <div className="flex aspect-[16/9] items-center justify-center bg-muted/40"><FlaskConical className="h-12 w-12 text-accent/40" /></div>}<div className="p-5"><div className="mb-3 flex items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>{label}</span><ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-accent" /></div><h2 className="text-lg font-semibold">{experiment.title || 'Experimento legacy'}</h2><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{experiment.description}</p>{experiment.stack.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{experiment.stack.map((tech) => <span key={tech} className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{tech}</span>)}</div>}</div></Link></StaggerItem>; })}</StaggerContainer>}
  </div></div>;
}
