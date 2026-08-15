import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import { getPublishedPosts } from '@/lib/api/posts';
import { FadeIn } from '@/components/motion/fade-in';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artículos sobre desarrollo web, infraestructura, homelab y tecnología.',
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="py-16">
      <div className="section-container">
        <FadeIn>
          <h1 className="section-title">Blog</h1>
          <p className="section-subtitle">
            Tutoriales, reflexiones y documentación técnica. Sin WordPress, con CMS propio.
          </p>
        </FadeIn>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/recursos" className="glass-card p-5 transition-colors hover:border-accent/50">
            <h2 className="font-semibold text-accent">Recursos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Scripts, plantillas y stacks útiles para tus proyectos.
            </p>
          </Link>
          <Link href="/cursos" className="glass-card p-5 transition-colors hover:border-accent/50">
            <h2 className="font-semibold text-accent">Cursos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Formación sobre desarrollo, infraestructura y DevOps.
            </p>
          </Link>
        </div>

        {posts.length === 0 ? (
          <FadeIn className="mt-12">
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">
                Aún no hay artículos publicados. Crea uno desde el{' '}
                <Link href="/admin/posts/new" className="text-accent hover:underline">
                  panel de administración
                </Link>
                .
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="mt-12 space-y-6">
            {posts.map((post) => (
              <FadeIn key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <article className="glass-card p-6 hover-lift">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {post.publishedAt && (
                        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTime} min lectura
                      </span>
                      {post.category && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-accent">
                          {post.category.name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold transition-colors group-hover:text-accent">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
                    )}
                    {post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map(({ tag }) => (
                          <span key={tag.id} className="font-mono text-xs text-muted-foreground">
                            #{tag.slug}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
