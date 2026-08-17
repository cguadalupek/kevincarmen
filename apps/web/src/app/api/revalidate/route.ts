import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { POSTS_CACHE_TAG } from '@/lib/api/posts';
import { TIMELINE_CACHE_TAG } from '@/lib/api/timeline';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  const expected = process.env.REVALIDATE_SECRET ?? 'kevincarmen-dev-secret';

  if (secret !== expected) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === 'string' ? body.slug : undefined;

  revalidateTag(POSTS_CACHE_TAG);
  revalidateTag(TIMELINE_CACHE_TAG);
  revalidatePath('/', 'layout');
  revalidatePath('/blog');
  revalidatePath('/feed.xml');
  revalidatePath('/sitemap.xml');

  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
