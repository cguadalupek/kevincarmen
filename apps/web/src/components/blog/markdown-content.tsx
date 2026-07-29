import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';
import { CodeBlock } from '@/components/blog/code-block';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
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
              <Image
                src={src}
                alt={alt ?? 'Imagen del artículo'}
                width={width}
                height={height}
                className="h-auto max-w-full rounded-lg border border-border"
                style={{
                  width: props.width ? `${props.width}px` : '100%',
                  maxWidth: '100%',
                }}
                unoptimized
              />
              {alt && alt !== 'Imagen del artículo' && (
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
      {content}
    </ReactMarkdown>
  );
}
