import { Clock, FileText, FolderTree } from 'lucide-react';
import { cn } from '@kevincarmen/utils';
import { getCategoryTree } from '@/lib/api/categories';
import { getPublishedPosts } from '@/lib/api/posts';

interface BlogStatsCardProps {
  /** Clases extra para colocarlo (el consumidor decide el contexto). */
  className?: string;
}

interface Stat {
  label: string;
  value: string;
  hint: string;
  Icon: typeof FileText;
}

/**
 * Resumen del blog (Server Component): artículos publicados, lectura media y
 * categorías. Los datos salen de `src/lib/api/` — el mismo origen que /blog
 * (`cache: 'no-store'`), así que el CMS se refleja al instante.
 *
 * NOTA: no muestra "vistas" porque el sistema no registra visitas: `Post` no
 * tiene contador y el API no expone ningún endpoint de estadísticas. Si algún
 * día se añade, entra aquí como una métrica más — nunca con un 0 de relleno.
 */
export async function BlogStatsCard({ className }: BlogStatsCardProps) {
  const [posts, categoryTree] = await Promise.all([getPublishedPosts(), getCategoryTree()]);

  // Si el API no responde, mejor no pintar la tarjeta que un 0 que parece real.
  if (posts.length === 0 && categoryTree.length === 0) return null;

  const readingTimes = posts
    .map((post) => post.readingTime)
    .filter((minutes) => Number.isFinite(minutes) && minutes > 0);
  const averageReadingTime = readingTimes.length
    ? Math.round(readingTimes.reduce((total, minutes) => total + minutes, 0) / readingTimes.length)
    : 0;

  const subcategories = categoryTree.reduce((total, node) => total + node.subcategories.length, 0);

  const stats: Stat[] = [
    {
      label: 'Artículos',
      value: String(posts.length),
      hint: posts.length === 1 ? 'publicado' : 'publicados',
      Icon: FileText,
    },
    // Sin tiempos de lectura reales la métrica sobra: no se inventa un 0.
    ...(averageReadingTime > 0
      ? [
          {
            label: 'Lectura media',
            value: String(averageReadingTime),
            hint: 'min por artículo',
            Icon: Clock,
          },
        ]
      : []),
    {
      label: 'Categorías',
      value: String(categoryTree.length),
      hint: `${subcategories} subcategoría${subcategories === 1 ? '' : 's'}`,
      Icon: FolderTree,
    },
  ];

  return (
    <section aria-label="Resumen del blog" className={cn('glass-card p-4 sm:p-5', className)}>
      <p className="font-mono text-xs uppercase tracking-wider text-accent">/ resumen</p>

      <dl className="mt-3 grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map(({ label, value, hint, Icon }) => (
          <div key={label} className="flex min-h-[44px] items-center gap-3 py-2 sm:px-4 sm:py-1">
            <Icon aria-hidden className="h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
              <dd className="text-lg font-semibold leading-tight">
                {value} <span className="text-xs font-normal text-muted-foreground">{hint}</span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
