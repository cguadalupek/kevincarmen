'use client';

import { usePathname } from 'next/navigation';
import { siteConfig } from '@kevincarmen/config';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { UniverseBackground } from '@/components/background/universe-background';

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <UniverseBackground />
      <Header />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: siteConfig.name,
                url: siteConfig.url,
                inLanguage: 'es-ES',
              },
              {
                '@type': 'Person',
                name: siteConfig.name,
                url: siteConfig.url,
                email: siteConfig.email,
                jobTitle: 'Desarrollador y Profesor de Computación',
                sameAs: Object.values(siteConfig.social),
              },
            ],
          }),
        }}
      />
    </div>
  );
}
