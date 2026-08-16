import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts } from '@/lib/api/posts';
import { FadeIn } from '@/components/motion/fade-in';
import { BlogPostList } from '@/components/blog/blog-post-list';

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
        ) : <BlogPostList posts={posts} />}
      </div>
    </div>
  );
}
