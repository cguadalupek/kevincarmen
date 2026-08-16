import type { Metadata } from 'next';
import { BlogExplorer } from '@/components/blog/blog-explorer';
import { getBlogCategories, getPublishedPosts } from '@/lib/api/posts';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artículos sobre desarrollo, infraestructura, redes, hardware, IA y soporte TI.',
  alternates: { canonical: '/blog' },
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  categoria?: string;
}

interface BlogPageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function BlogPage({
  searchParams,
}: BlogPageProps) {
  const selectedSlug = (await searchParams)?.categoria;
  const categories = await getBlogCategories();
  const posts = await getPublishedPosts({ categorySlug: selectedSlug });

  return (
    <BlogExplorer
      posts={posts}
      categories={categories}
      selectedSlug={selectedSlug ?? null}
    />
  );
}
