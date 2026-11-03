import type { Metadata } from 'next';
import { BlogExplorer } from '@/components/blog/blog-explorer';
import { getPublishedPosts } from '@/lib/api/posts';
import { getCategoryTree } from '@/lib/api/categories';
import { getLikeCounts } from '@/lib/api/likes';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Artículos sobre software y desarrollo, infraestructura y homelab, IT y hardware, e IA y tecnología.',
  alternates: { canonical: '/blog' },
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  categoria?: string;
  subcategoria?: string;
}

interface BlogPageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const selectedCategory = params?.categoria ?? null;
  const selectedSubcategory = params?.subcategoria ?? null;

  // El árbol se necesita para pintar los filtros; los posts ya vienen filtrados
  // por el API (que además traduce los slugs de la taxonomía antigua).
  const [categoryTree, posts] = await Promise.all([
    getCategoryTree(),
    getPublishedPosts({
      categorySlug: selectedCategory ?? undefined,
      subCategorySlug: selectedSubcategory ?? undefined,
    }),
  ]);

  // Una sola llamada para los contadores de todas las tarjetas del listado.
  const likeCounts = await getLikeCounts(
    'POST',
    posts.map((post) => post.id),
  );

  return (
    <BlogExplorer
      posts={posts}
      categoryTree={categoryTree}
      likeCounts={likeCounts}
      selectedCategory={selectedCategory}
      selectedSubcategory={selectedSubcategory}
    />
  );
}
