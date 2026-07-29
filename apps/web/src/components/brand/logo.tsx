import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 40, showText = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/logo.png"
        alt="Kevin Carmen Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-widest text-foreground">KEVIN CARMEN</span>
          <span className="font-mono text-xs text-muted-foreground">kevincarmen.xyz</span>
        </div>
      )}
    </div>
  );
}
