'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Code2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (props: { editor: import('@tiptap/react').Editor; range: { from: number; to: number } }) => void;
}

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: 'Código',
    description: 'Bloque de código con resaltado',
    icon: <Code2 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setCodeBlock({ language: 'powershell' })
        .run();
    },
  },
  {
    title: 'Imagen',
    description: 'Subir o pegar una imagen',
    icon: <ImageIcon className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      document.getElementById('post-editor-image-input')?.click();
    },
  },
];

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  function SlashCommandList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) command(items[selectedIndex]);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="slash-menu">
          <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
        </div>
      );
    }

    return (
      <div className="slash-menu">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={cn('slash-menu-item', index === selectedIndex && 'slash-menu-item-active')}
            onClick={() => command(item)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="slash-menu-icon">{item.icon}</span>
            <span className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </span>
          </button>
        ))}
      </div>
    );
  },
);
