import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { CodeBlock } from '@/components/blog/code-block';
import { LightboxImage } from '@/components/blog/lightbox-image';
import { VideoEmbed } from '@/components/blog/video-embed';
import { rehypeHeadingIds, type TocHeading } from '@/lib/blog/headings';

interface MarkdownContentProps {
  content: string;
  title?: string;
  /** Clases extra para el contenedor (sustituye el margen superior por defecto `mt-12`). */
  className?: string;
  /**
   * Encabezados que definen la tabla de contenidos. Al pasarlos, los h2/h3 del
   * contenido reciben `id` + `scroll-mt-24` (anchors sin JavaScript) usando
   * ESTA lista como fuente de ids.
   *
   * Es opt-in a propósito: una página que monta varios `MarkdownContent` (ficha
   * de Lab, proyecto por secciones) repetiría ids de encabezados homónimos.
   */
  headings?: TocHeading[];
}

export function MarkdownContent({ content, title, className, headings }: MarkdownContentProps) {
  const visibleContent = removeRepeatedTitle(content, title);
  const normalizedContent = normalizeEmbeds(visibleContent);
  const rehypePlugins = headings ? [rehypeRaw, rehypeHeadingIds(headings)] : [rehypeRaw];

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={rehypePlugins}
      className={`prose prose-invert prose-accent max-w-none prose-img:rounded-lg prose-img:border prose-img:border-border ${
        className ?? 'mt-12'
      }`}
      components={{
        img: ({ src, alt, ...props }) => {
          if (!src || typeof src !== 'string') return null;
          const width = typeof props.width === 'number' ? props.width : 800;
          const height = typeof props.height === 'number' ? props.height : 450;
          return (
            <span className="my-6 block">
              <LightboxImage
                src={src}
                alt={alt ?? 'Imagen del artículo'}
                width={width}
                height={height}
              />
              {alt && !isDefaultImageAlt(alt) && (
                <span className="mt-2 block text-center text-sm text-muted-foreground">{alt}</span>
              )}
            </span>
          );
        },
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className ?? '');
          const codeString = String(children).replace(/\n$/, '');
          const isInline = !match && !codeString.includes('\n');

          if (isInline) {
            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-accent"
                {...props}
              >
                {children}
              </code>
            );
          }

          return <CodeBlock code={codeString} language={match?.[1] ?? 'plaintext'} />;
        },
        a: ({ href, children, ...props }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        ),
        iframe: ({ src, ...props }) => {
          if (!src || typeof src !== 'string') return null;
          return (
            <VideoEmbed
              src={src}
              title={(props.title as string | undefined) ?? 'Video embebido'}
              width={typeof props.width === 'string' ? props.width : undefined}
              height={typeof props.height === 'string' ? props.height : undefined}
            />
          );
        },
        video: ({ src, ...props }) => {
          if (!src || typeof src !== 'string') return null;
          return (
            <VideoEmbed
              src={src}
              title={(props.title as string | undefined) ?? 'Video embebido'}
              width={typeof props.width === 'string' ? props.width : undefined}
              height={typeof props.height === 'string' ? props.height : undefined}
            />
          );
        },
      }}
    >
      {normalizedContent}
    </ReactMarkdown>
  );
}

function normalizeEmbeds(content: string) {
  return content.replace(
    /<video[^>]*src=["']([^"']+)["'][^>]*>\s*<\/video>|<iframe[^>]*src=["']([^"']+)["'][^>]*>\s*<\/iframe>/g,
    (match, src: string) => {
      const embedUrl = youtubeEmbed(src) ?? src;
      const title = extractAttr(match, 'title') ?? 'Video embebido';
      const width = extractAttr(match, 'width') ?? '800';
      const height = extractAttr(match, 'height') ?? '450';
      return `<div data-embed="${encodeURIComponent(embedUrl)}" data-title="${encodeURIComponent(title)}" data-width="${width}" data-height="${height}"></div>`;
    },
  );
}

function extractAttr(tag: string, name: string) {
  const regex = new RegExp(`${name}=["']([^"']+)["']`, 'i');
  return tag.match(regex)?.[1];
}

function youtubeEmbed(url: string) {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? '';
    if (u.hostname.includes('youtube-nocookie')) id = u.pathname.split('/').pop() ?? '';
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function removeRepeatedTitle(content: string, title?: string) {
  if (!title) return content;

  const match = content.match(/^\s*#\s+(.+?)(?:\r?\n|$)/);
  if (!match || match[1].trim() !== title.trim()) return content;

  return content.slice(match[0].length).replace(/^\r?\n/, '');
}

function isDefaultImageAlt(alt: string) {
  return (
    alt === 'Imagen del artículo' ||
    alt.toLowerCase() === 'image' ||
    /\.(png|jpe?g|gif|webp)$/i.test(alt)
  );
}
