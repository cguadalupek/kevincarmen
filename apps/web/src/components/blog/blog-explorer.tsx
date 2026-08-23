'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, Search, X } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import type { PublicPost } from '@/lib/api/posts';
import { FadeIn } from '@/components/motion/fade-in';

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

const REQUIRED_CATEGORIES = [
  { slug: 'desarrollo', name: 'Desarrollo' },
  { slug: 'hardware', name: 'Hardware' },
  { slug: 'ia', name: 'IA' },
  { slug: 'homelab', name: 'Homelab' },
  { slug: 'redes', name: 'Redes' },
  { slug: 'soporte-ti', name: 'Soporte TI' },
] as const;

interface BlogExplorerProps {
  posts: PublicPost[];
  categories: BlogCategory[];
  selectedSlug: string | null;
}

export function BlogExplorer({ posts, categories, selectedSlug }: BlogExplorerProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeSearch(debouncedQuery);
    if (!normalizedQuery) return posts;

    return posts
      .map((post) => ({ post, score: scoreMatch(post, normalizedQuery) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ post }) => post);
  }, [posts, debouncedQuery]);

  const displayCategories = REQUIRED_CATEGORIES.map((required) => {
    const existing = categories.find((category) => category.slug === required.slug || (required.slug === 'homelab' && category.name === 'Infraestructura'));
    return existing ? { ...existing, name: required.name } : { id: `fixed-${required.slug}`, ...required };
  });

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  const featuredPost = filteredPosts
    .filter((post) => post.featured)
    .sort((a, b) => new Date(b.publishedAt ?? b.updatedAt).getTime() - new Date(a.publishedAt ?? a.updatedAt).getTime())[0] ?? null;
  const regularPosts = featuredPost
    ? filteredPosts.filter((post) => post.id !== featuredPost.id)
    : filteredPosts;
  const totalPages = Math.ceil(regularPosts.length / postsPerPage);
  const paginatedPosts = useMemo(() => {
    return regularPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
  }, [regularPosts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedSlug]);

  const showDropdown = debouncedQuery.trim().length >= 2;

  return (
    <>
      <div className="section-container mx-auto py-16">
        <div className="flex items-center gap-3 text-accent"><BookOpen className="h-6 w-6" /><span className="font-mono text-sm">/ artículos</span></div>
        <h1 className="section-title mt-3">Blog</h1>
        <p className="section-subtitle">
          Tutoriales, reflexiones y documentación técnica organizados por categoría.
        </p>

        <nav
          aria-label="Categorías"
          className="mt-8 flex flex-wrap gap-2"
        >
          <CategoryPill
            label="Todos"
            isActive={!selectedSlug}
            href="/blog"
            count={null}
          />
          {displayCategories.map((category) => (
            <CategoryPill
              key={category.id}
              label={category.name}
              isActive={selectedSlug === category.slug}
              href={`/blog?categoria=${category.slug}`}
              count={null}
            />
          ))}
        </nav>

        <div className="relative mt-6 max-w-full lg:max-w-[500px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar artículos..."
            aria-label="Buscar artículos"
            className="w-full rounded-lg border border-border bg-muted/40 py-3 pl-10 pr-10 outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showDropdown && filteredPosts.length > 0 && (
        <div className="section-container mt-3 rounded-xl border border-border bg-card/70 p-2 shadow-xl">
          {filteredPosts.slice(0, 5).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60"
            >
              {post.coverImage ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                  <Image
                    src={post.coverImage}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-[10px] text-muted-foreground">
                  Blog
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{post.title}</p>
                <p className="truncate text-xs text-muted-foreground">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="section-container mx-auto">
        {filteredPosts.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-card/50 p-10 text-center">
            <p className="text-muted-foreground">No se encontraron artículos que coincidan con tu búsqueda.</p>
            {(query || selectedSlug) && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 text-sm font-medium text-accent hover:underline"
              >
                Limpiar búsqueda y filtros
              </button>
            )}
          </div>
        ) : (
          <div className="mt-12">
            {featuredPost && (
              <section aria-labelledby="featured-post-title" className="mb-14">
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">Destacado</p>
                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                  <article className="glass-card overflow-hidden transition-shadow hover:shadow-lg hover:shadow-accent/5">
                    <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                      <div className="relative aspect-video min-h-56 overflow-hidden border-b border-border md:aspect-auto md:min-h-72 md:border-b-0 md:border-r">
                        {featuredPost.coverImage ? (
                          <Image src={featuredPost.coverImage} alt={`Portada de ${featuredPost.title}`} fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">Sin miniatura</div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center p-6 md:p-8">
                        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {featuredPost.category && <CategoryBadge category={featuredPost.category.slug} label={featuredPost.category.name} />}
                          {featuredPost.publishedAt && <time dateTime={featuredPost.publishedAt}>{formatDate(featuredPost.publishedAt)}</time>}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{featuredPost.readingTime} min lectura</span>
                        </div>
                        <h2 id="featured-post-title" className="text-2xl font-semibold transition-colors group-hover:text-accent md:text-3xl">{featuredPost.title}</h2>
                        {featuredPost.excerpt && <p className="mt-3 text-muted-foreground">{featuredPost.excerpt}</p>}
                        <span className="mt-5 text-sm font-medium text-accent">Leer artículo →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              </section>
            )}

            {regularPosts.length > 0 && (
              <section aria-labelledby="latest-posts-title">
                <h2 id="latest-posts-title" className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Últimos artículos</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedPosts.map((post) => (
                    <FadeIn key={post.id}>
                      <Link href={`/blog/${post.slug}`} className="group block h-full">
                        <article className="glass-card flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg hover:shadow-accent/5">
                          <div className="relative aspect-video w-full shrink-0 overflow-hidden border-b border-border bg-muted/40">
                            {post.coverImage ? (
                              <Image src={post.coverImage} alt={`Portada de ${post.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                            ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin miniatura</div>}
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min</span>
                            </div>
                            <div className="mb-3 flex flex-wrap gap-2">{post.category && <CategoryBadge category={post.category.slug} label={post.category.name} />}</div>
                            <h3 className="text-xl font-semibold transition-colors group-hover:text-accent">{post.title}</h3>
                            {post.excerpt && <p className="mt-2 line-clamp-3 text-muted-foreground">{post.excerpt}</p>}
                            <span className="mt-auto pt-5 text-sm font-medium text-accent">Leer artículo →</span>
                          </div>
                        </article>
                      </Link>
                    </FadeIn>
                  ))}
                </div>
              </section>
            )}

            {totalPages > 1 && (
              <nav aria-label="Paginación de artículos" className="mt-10 flex items-center justify-center gap-2 pb-8">
                <button type="button" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} aria-label="Página anterior" className="rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40">←</button>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  return <button key={pageNumber} type="button" onClick={() => setCurrentPage(pageNumber)} disabled={currentPage === pageNumber} aria-current={currentPage === pageNumber ? 'page' : undefined} className={`rounded-md px-3 py-2 text-sm font-medium ${currentPage === pageNumber ? 'bg-accent text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'}`}>{pageNumber}</button>;
                })}
                <button type="button" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} aria-label="Siguiente página" className="rounded-md bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40">→</button>
              </nav>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  desarrollo: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300',
  hardware: 'border-amber-400/50 bg-amber-400/10 text-amber-300',
  ia: 'border-violet-400/50 bg-violet-400/10 text-violet-300',
  homelab: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300',
  redes: 'border-blue-400/50 bg-blue-400/10 text-blue-300',
  'soporte-ti': 'border-rose-400/50 bg-rose-400/10 text-rose-300',
};

function CategoryBadge({ category, label }: { category: string; label: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${CATEGORY_COLORS[category] ?? 'border-accent/50 bg-accent/10 text-accent'}`}>{label}</span>;
}

function CategoryPill({
  label,
  href,
  isActive,
  count,
}: {
  label: string;
  href: string;
  isActive: boolean;
  count: number | null;
}) {
  void count;
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        isActive
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border bg-card/40 text-muted-foreground hover:border-accent/50 hover:text-accent'
      }`}
    >
      {label}
    </Link>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function scoreMatch(post: PublicPost, query: string) {
  const title = normalizeSearch(post.title);
  const excerpt = normalizeSearch(post.excerpt ?? '');
  const tags = post.tags.map(({ tag }) => normalizeSearch(`${tag.name} ${tag.slug}`)).join(' ');
  if (title.startsWith(query)) return 4;
  if (title.includes(query)) return 3;
  if (excerpt.includes(query)) return 2;
  if (tags.includes(query)) return 1;
  return 0;
}