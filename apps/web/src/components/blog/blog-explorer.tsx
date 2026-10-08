'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, Search, X } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import type { MainCategoryValue, PublicPost } from '@/lib/api/posts';
import type { CategoryTreeNode } from '@/lib/api/categories';
import { LEGACY_CATEGORY_SLUG_MAP, categoryLabel } from '@/lib/categories';
import { FadeIn } from '@/components/motion/fade-in';
import { CategoryBadge } from '@/components/blog/category-badge';

interface BlogExplorerProps {
  posts: PublicPost[];
  categoryTree: CategoryTreeNode[];
  /** Valor del enum o slug de la taxonomía antigua, tal cual llega en la URL. */
  selectedCategory: string | null;
  /** Slug de la subcategoría. */
  selectedSubcategory: string | null;
}

export function BlogExplorer({
  posts,
  categoryTree,
  selectedCategory,
  selectedSubcategory,
}: BlogExplorerProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  /**
   * El enlace entrante puede traer un slug antiguo (`?categoria=hardware`), así
   * que se normaliza al valor del enum para saber qué pill marcar como activa.
   */
  const activeCategory = useMemo<MainCategoryValue | null>(() => {
    if (!selectedCategory) return null;

    const known = categoryTree.find((node) => node.value === selectedCategory);
    if (known) return known.value;

    return LEGACY_CATEGORY_SLUG_MAP[selectedCategory.toLowerCase()] ?? null;
  }, [selectedCategory, categoryTree]);

  const activeNode = useMemo(
    () => categoryTree.find((node) => node.value === activeCategory) ?? null,
    [categoryTree, activeCategory],
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeSearch(debouncedQuery);
    if (!normalizedQuery) return posts;

    return posts
      .map((post) => ({ post, score: scoreMatch(post, normalizedQuery) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ post }) => post);
  }, [posts, debouncedQuery]);

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
  }, [debouncedQuery, selectedCategory, selectedSubcategory]);

  const showDropdown = debouncedQuery.trim().length >= 2;

  return (
    <>
      <div className="section-container mx-auto py-16">
        <div className="flex items-center gap-3 text-accent"><BookOpen className="h-6 w-6" /><span className="font-mono text-sm">/ artículos</span></div>
        <h1 className="section-title mt-3">Blog</h1>
        <p className="section-subtitle">
          Tutoriales, reflexiones y documentación técnica organizados por categoría y subcategoría.
        </p>

        <nav aria-label="Categorías principales" className="mt-8 flex flex-wrap gap-2">
          <CategoryPill label="Todos" isActive={!activeCategory} href="/blog" />
          {categoryTree.map((category) => (
            <CategoryPill
              key={category.value}
              label={category.label}
              isActive={activeCategory === category.value}
              href={`/blog?categoria=${encodeURIComponent(category.value)}`}
            />
          ))}
        </nav>

        {/* Segundo nivel: solo aparece cuando hay una principal elegida. */}
        {activeNode && activeNode.subcategories.length > 0 && (
          <nav
            aria-label={`Subcategorías de ${activeNode.label}`}
            className="mt-3 flex flex-wrap gap-2 border-l-2 border-accent/30 pl-3"
          >
            <SubcategoryPill
              label="Todas"
              isActive={!selectedSubcategory}
              href={`/blog?categoria=${encodeURIComponent(activeNode.value)}`}
            />
            {activeNode.subcategories.map((subcategory) => (
              <SubcategoryPill
                key={subcategory.id}
                label={subcategory.name}
                isActive={selectedSubcategory === subcategory.slug}
                href={`/blog?categoria=${encodeURIComponent(activeNode.value)}&subcategoria=${encodeURIComponent(subcategory.slug)}`}
              />
            ))}
          </nav>
        )}

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
            <p className="text-muted-foreground">
              {activeNode
                ? `No hay artículos publicados en ${activeNode.label}${
                    selectedSubcategory ? ` › ${selectedSubcategory}` : ''
                  }.`
                : 'No se encontraron artículos que coincidan con tu búsqueda.'}
            </p>
            {(query || activeCategory) && (
              <Link
                href="/blog"
                className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
              >
                Ver todos los artículos
              </Link>
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
                          <CategoryBadge category={featuredPost.mainCategory} subcategory={featuredPost.subCategory?.name} />
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
                            <div className="mb-3 flex flex-wrap gap-2">
                              <CategoryBadge category={post.mainCategory} subcategory={post.subCategory?.name} />
                            </div>
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

function CategoryPill({
  label,
  href,
  isActive,
}: {
  label: string;
  href: string;
  isActive: boolean;
}) {
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

function SubcategoryPill({
  label,
  href,
  isActive,
}: {
  label: string;
  href: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        isActive
          ? 'border-accent/70 bg-accent/10 text-accent'
          : 'border-border/70 bg-card/30 text-muted-foreground hover:border-accent/40 hover:text-accent'
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
  // La taxonomía también entra en la búsqueda: buscar "homelab" o "docker"
  // encuentra los artículos aunque la palabra no esté en el título.
  const taxonomy = normalizeSearch(
    `${categoryLabel(post.mainCategory)} ${post.subCategory?.name ?? ''} ${
      post.subCategory?.slug ?? ''
    }`,
  );
  if (title.startsWith(query)) return 4;
  if (title.includes(query)) return 3;
  if (excerpt.includes(query)) return 2;
  if (taxonomy.includes(query)) return 2;
  if (tags.includes(query)) return 1;
  return 0;
}
