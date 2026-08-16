import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from '@/components/blog/code-block';
import { LightboxImage } from '@/components/blog/lightbox-image';
import type { ComponentProps } from 'react';

interface MarkdownContentProps {
  content: string;
  title?: string;
}

export function MarkdownContent({ content, title }: MarkdownContentProps) {
  const visibleContent = removeRepeatedTitle(content, title);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      className="prose prose-invert prose-accent mt-12 max-w-none prose-img:rounded-lg prose-img:border prose-img:border-border"
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
      }}
    >
      {visibleContent}
    </ReactMarkdown>
  );
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
