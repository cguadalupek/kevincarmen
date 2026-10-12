import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, FlaskConical, Layers, Play } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';
import { getLabExperiments, type ExperimentStatus } from '@/lib/api/lab';
import { LabExplorer } from '@/components/lab/lab-explorer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Laboratorio de Experimentos',
  description:
    'Cuaderno de pruebas técnicas documentadas: qué probé, qué salió bien, qué salió mal y cómo lo resolví. Cada experimento incluye su video largo.',
};

const STATUS_LABEL: Record<ExperimentStatus, string> = {
  IN_PROGRESS: 'En pruebas',
  SUCCESS: 'Funcionó',
  PARTIAL: 'Funcionó con limitaciones',
  FAILED: 'No funcionó',
  ABANDONED: 'Abandonado',
};

export default async function LabPage() {
  const experiments = await getLabExperiments();
  const [featured, ...rest] = experiments;

  const stacks = new Set<string>();
  let totalMinutes = 0;
  let videos = 0;
  for (const experiment of experiments) {
    experiment.stack.forEach((tech) => stacks.add(tech));
    if (experiment.videoUrl) {
      videos += 1;
      totalMinutes += experiment.videoDuration ?? 0;
    }
  }

  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <div className="flex items-center gap-3 text-accent">
            <FlaskConical className="h-6 w-6" />
            <span className="font-mono text-sm">/ technical experiments</span>
          </div>
          <h1 className="section-title mt-3">Laboratorio de Experimentos</h1>
          <p className="section-subtitle">
            Pruebas reales documentadas de punta a punta: lo que intenté, cómo lo monté, qué datos
            obtuve y qué aprendí. Cada experimento está explicado en un video largo.
          </p>
        </FadeIn>

        {experiments.length > 0 && (
          <StaggerContainer className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: String(experiments.length), label: 'experimentos documentados' },
              { value: String(stacks.size), label: 'tecnologías distintas' },
              { value: String(videos), label: 'videos explicativos' },
              { value: totalMinutes > 0 ? `${totalMinutes}` : '—', label: 'minutos de video' },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="glass-card p-5 text-center">
                  <p className="text-2xl font-bold text-accent">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {featured && (
          <FadeIn>
            <Link
              href={`/lab/${featured.slug}`}
              className="glass-card group mt-8 grid overflow-hidden transition hover:border-accent/50 md:grid-cols-5"
            >
              <div className="relative aspect-video md:col-span-3 md:aspect-auto">
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    priority
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 768px) 60vw, 100vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted/40">
                    <FlaskConical className="h-20 w-20 text-accent/40" />
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 font-mono text-xs text-accent backdrop-blur">
                  ÚLTIMO EXPERIMENTO
                </span>
                {featured.videoUrl && (
                  <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur">
                    <Play className="h-3.5 w-3.5" />
                    {featured.videoDuration ? `${featured.videoDuration} min` : 'Video largo'}
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-center gap-3 p-7 md:col-span-2">
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  {STATUS_LABEL[featured.status]}
                </span>
                <h2 className="text-2xl font-bold">{featured.title}</h2>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {featured.description}
                </p>
                {featured.stack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {featured.stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  Leer el experimento{' '}
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          </FadeIn>
        )}

        <div className="mt-14 flex items-center gap-3 text-accent">
          <Layers className="h-5 w-5" />
          <span className="font-mono text-sm">/ all experiments</span>
        </div>
        <LabExplorer experiments={rest} />

        {experiments.length === 0 && (
          <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            Aún no hay experimentos documentados. Vuelve pronto.
          </div>
        )}
      </div>
    </div>
  );
}
