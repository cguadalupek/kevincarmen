import { siteConfig } from '@kevincarmen/config';
import { getPublishedPosts } from '@/lib/api/posts';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const posts = await getPublishedPosts();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name} — Blog</title>
    <link>${siteConfig.url}/blog</link>
    <description>${siteConfig.description}</description>
    <language>es</language>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${post.title}</title>
      <link>${siteConfig.url}/blog/${post.slug}</link>
      <guid>${siteConfig.url}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt ?? Date.now()).toUTCString()}</pubDate>
      <description>${post.excerpt ?? ''}</description>
    </item>`,
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
