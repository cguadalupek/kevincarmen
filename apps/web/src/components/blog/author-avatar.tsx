import Image from 'next/image';
import { cn } from '@kevincarmen/utils';

interface AuthorAvatarProps {
  name: string;
  src?: string | null;
  /** Lado del avatar en píxeles (24 en el badge, 56 en la tarjeta). */
  size?: number;
  className?: string;
}

/**
 * Avatar del autor. Si el CMS todavía no tiene foto (`author.avatar`) pinta un
 * monograma con las iniciales en acento cyan: nunca una imagen rota ni un
 * placeholder ajeno.
 */
export function AuthorAvatar({ name, src, size = 40, className }: AuthorAvatarProps) {
  const box = { width: size, height: size };

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        style={box}
        unoptimized
        className={cn('shrink-0 rounded-full border border-border object-cover', className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ ...box, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono font-semibold leading-none text-accent',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return letters || '?';
}
