import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import type { PublicPost } from '@/lib/api/posts';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';

interface ArticlesSectionProps {
  posts: PublicPost[];
}

export function ArticlesSection({ posts }: ArticlesSectionProps) {
  return (
    <section className="py-20" id="articulos">
      <div className="section-container">
        <FadeIn className="flex items-end justify-between">
          <div>
            <h2 className="section-title">Últimos artículos</h2>
            <p className="section-subtitle">
              Reflexiones, tutoriales y documentación sobre desarrollo e infraestructura.
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden items-center gap-1 text-sm text-accent sm:flex"
          >
            Ver blog
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </FadeIn>

        {posts.length === 0 ? (
          <FadeIn className="mt-12">
            <p className="text-center text-muted-foreground">
              Próximamente nuevos artículos.
            </p>
          </FadeIn>
        ) : (
          <StaggerContainer className="mt-12 space-y-4">
            {posts.slice(0, 3).map((post) => (
              <StaggerItem key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <article className="glass-card p-6 hover-lift">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {post.publishedAt && (
                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readingTime} min
                          </span>
                          {post.category && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-accent">
                              {post.category.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold transition-colors group-hover:text-accent">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                        )}
                      </div>
                      <ArrowUpRight className="hidden h-5 w-5 text-muted-foreground transition-all group-hover:text-accent sm:block" />
                    </div>
                  </article>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
