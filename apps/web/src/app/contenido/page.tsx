import type { Metadata } from 'next';
import Link from 'next/link';
import { contentNav } from '@kevincarmen/config';

export const metadata: Metadata = {
  title: 'Contenido',
  description: 'Blog, proyectos, cursos y recursos de Kevin Carmen.',
  alternates: { canonical: '/contenido' },
};

export default function ContentPage() {
  return (
    <div className="py-16">
      <div className="section-container max-w-4xl">
        <h1 className="section-title">Contenido</h1>
        <p className="section-subtitle">
          Tutoriales, proyectos y formación sobre desarrollo, infraestructura y tecnología.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contentNav.map((item) => (
            <Link key={item.href} href={item.href} className="glass-card p-6 hover-lift">
              <h2 className="text-xl font-semibold text-accent">{item.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Explora el contenido de {item.label.toLowerCase()}.
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
