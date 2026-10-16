import { Clock } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import { AuthorAvatar } from '@/components/blog/author-avatar';

interface AuthorBadgeProps {
  name: string;
  avatar?: string | null;
  publishedAt?: string | null;
  readingTime?: number;
}

/**
 * Atribución minimalista en la línea de metadatos del artículo:
 * `[avatar] Kevin Carmen • 17 de octubre de 2026 • 4 min lectura`.
 */
export function AuthorBadge({ name, avatar, publishedAt, readingTime }: AuthorBadgeProps) {
  return (
    <span className="flex items-center gap-2 font-medium text-foreground">
      <AuthorAvatar name={name} src={avatar} size={24} />
      <span>{name}</span>
      {publishedAt && (
        <>
          <span aria-hidden className="text-border">
            •
          </span>
          <time dateTime={publishedAt} className="font-normal">
            {formatDate(publishedAt)}
          </time>
        </>
      )}
      {typeof readingTime === 'number' && (
        <>
          <span aria-hidden className="text-border">
            •
          </span>
          <span className="flex items-center gap-1 font-normal">
            <Clock className="h-3.5 w-3.5" />
            {readingTime} min lectura
          </span>
        </>
      )}
    </span>
  );
}
