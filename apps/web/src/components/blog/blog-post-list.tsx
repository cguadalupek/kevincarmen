'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Clock, Search } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import type { PublicPost } from '@/lib/api/posts';
import { FadeIn } from '@/components/motion/fade-in';

export function BlogPostList({ posts }: { posts: PublicPost[] }) {
  const [query, setQuery] = useState('');
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return posts;

    return posts.filter((post) => {
      const tags = post.tags.map(({ tag }) => `${tag.name} ${tag.slug}`).join(' ');
      return `${post.title} ${post.excerpt ?? ''} ${tags}`.toLowerCase().includes(normalizedQuery);
    });
  }, [posts, query]);

  return (
    <>
      <div className="relative mt-8 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar artículos..."
          aria-label="Buscar artículos"
          className="w-full rounded-lg border border-border bg-muted/40 py-3 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <div className="mt-12 rounded-xl border border-border bg-card/50 p-10 text-center text-muted-foreground">
          No encontramos artículos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="mt-12 space-y-6">
          {filteredPosts.map((post) => (
            <FadeIn key={post.id}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <article className="glass-card flex flex-col gap-6 p-5 transition-shadow hover:shadow-lg hover:shadow-accent/5 md:flex-row md:p-6">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readingTime} min lectura
                      </span>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {post.category && (
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                          {post.category.name}
                        </span>
                      )}
                      {post.tags.map(({ tag }) => (
                        <span key={tag.id} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-xl font-semibold transition-colors group-hover:text-accent">
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="mt-2 text-muted-foreground">{post.excerpt}</p>}
                    <span className="mt-5 text-sm font-medium text-accent transition-colors group-hover:text-accent/80">
                      Leer artículo →
                    </span>
                  </div>

                  {post.coverImage ? (
                    <div className="relative order-first aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border md:order-last md:aspect-[4/3] md:w-64">
                      <Image
                        src={post.coverImage}
                        alt={`Portada de ${post.title}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 256px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="relative order-first aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 md:order-last md:aspect-[4/3] md:w-64" aria-hidden="true" />
                  )}
                </article>
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </>
  );
}
