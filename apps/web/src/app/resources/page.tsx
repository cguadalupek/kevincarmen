import type { Metadata } from 'next';
import { FolderArchive } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';
import { getResources } from '@/lib/api/resources';
import { ResourceExplorer } from '@/components/lab/resource-explorer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Recursos',
  description: 'Scripts, plantillas, Docker Compose y recursos descargables gratuitos.',
  alternates: { canonical: '/recursos' },
};

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <div className="flex items-center gap-3 text-accent">
            <FolderArchive className="h-6 w-6" />
            <span className="font-mono text-sm">/ recursos</span>
          </div>
          <h1 className="section-title mt-3">Recursos</h1>
          <p className="section-subtitle">
            Descargas gratuitas: scripts, plantillas, Docker Compose y más. Cada recurso nace de un
            experimento del Lab.
          </p>
        </FadeIn>

        <ResourceExplorer resources={resources} />

        {resources.length === 0 && (
          <div className="mt-12 rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            Los recursos se están preparando. Pronto habrá descargas disponibles.
          </div>
        )}
      </div>
    </div>
  );
}
