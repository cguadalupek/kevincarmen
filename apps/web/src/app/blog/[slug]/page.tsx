import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import { siteConfig } from '@kevincarmen/config';
import { getPostBySlug } from '@/lib/api/posts';
import { MarkdownContent } from '@/components/blog/markdown-content';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Artículo no encontrado' };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.author.name],
      url: `${siteConfig.url}/blog/${post.slug}`,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt ?? undefined,
            mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
            datePublished: post.publishedAt ?? undefined,
            dateModified: post.updatedAt,
            author: {
              '@type': 'Person',
              name: post.author.name,
            },
            publisher: {
              '@type': 'Person',
              name: siteConfig.name,
              url: siteConfig.url,
            },
            image: post.coverImage ? `${siteConfig.url}${post.coverImage}` : undefined,
          }),
        }}
      />
      <div className="section-container max-w-3xl">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al blog
        </Link>

        <header>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min lectura
            </span>
            {post.category && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-accent">
                {post.category.name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          )}
        </header>

        <MarkdownContent content={post.content} title={post.title} />

        {post.tags.length > 0 && (
          <footer className="mt-12 border-t border-border pt-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </footer>
        )}
      </div>
    </article>
  );
}
