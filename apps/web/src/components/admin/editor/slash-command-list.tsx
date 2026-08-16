'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  AlignLeft,
  Code2,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  PlayCircle,
  Quote,
  TerminalSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SlashCommandItem {
  title: string;
  description: string;
  category: 'Bloques básicos' | 'Contenido multimedia';
  icon: React.ReactNode;
  command?: (props: { editor: import('@tiptap/react').Editor; range: { from: number; to: number } }) => void;
}

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: 'Texto',
    description: 'Párrafo estándar',
    category: 'Bloques básicos',
    icon: <AlignLeft className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('paragraph')
        .run();
    },
  },
  {
    title: 'Encabezado 1',
    description: 'Título principal',
    category: 'Bloques básicos',
    icon: <Heading1 className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Encabezado 2',
    description: 'Título de sección',
    category: 'Bloques básicos',
    icon: <Heading2 className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Encabezado 3',
    description: 'Subtítulo de sección',
    category: 'Bloques básicos',
    icon: <Heading3 className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Lista con viñetas',
    description: 'Lista con guiones',
    category: 'Bloques básicos',
    icon: <List className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleList('bulletList', 'listItem').run(),
  },
  {
    title: 'Lista numerada',
    description: 'Lista ordenada',
    category: 'Bloques básicos',
    icon: <ListOrdered className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleList('orderedList', 'listItem').run(),
  },
  {
    title: 'Cita',
    description: 'Cita destacada',
    category: 'Bloques básicos',
    icon: <Quote className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Divisor',
    description: 'Separador horizontal',
    category: 'Bloques básicos',
    icon: <Minus className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Código en línea',
    description: 'Aplicar formato inline code',
    category: 'Bloques básicos',
    icon: <TerminalSquare className="h-4 w-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleMark('code').run(),
  },
  {
    title: 'URL',
    description: 'Insertar enlace a una URL',
    category: 'Bloques básicos',
    icon: <LinkIcon className="h-4 w-4" />,
  },
  {
    title: 'Mención',
    description: 'Insertar mención social (@usuario)',
    category: 'Bloques básicos',
    icon: <LinkIcon className="h-4 w-4" />,
  },
  {
    title: 'Marcado',
    description: 'Insertar @usuario o #etiqueta',
    category: 'Bloques básicos',
    icon: <LinkIcon className="h-4 w-4" />,
  },
  {
    title: 'Código',
    description: 'Bloque de código con resaltado',
    category: 'Contenido multimedia',
    icon: <Code2 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('codeBlock', { language: 'powershell' }).run();
    },
  },
  {
    title: 'Imagen',
    description: 'Subir o pegar una imagen',
    category: 'Contenido multimedia',
    icon: <ImageIcon className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      document.getElementById('post-editor-image-input')?.click();
    },
  },
  {
    title: 'Video / Embed',
    description: 'Insertar video (YouTube, TikTok, Vimeo, X)',
    category: 'Contenido multimedia',
    icon: <PlayCircle className="h-4 w-4" />,
    command: ({ editor }) => requestVideoEmbed(editor),
  },
  {
    title: 'Archivo multimedia',
    description: 'Insertar archivo embebido',
    category: 'Contenido multimedia',
    icon: <FileCode className="h-4 w-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).run(),
  },
];

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

function requestVideoEmbed(editor: import('@tiptap/react').Editor) {
  if (typeof window === 'undefined') return;
  const url = window.prompt(
    'Pega el enlace del video (YouTube, TikTok, Vimeo o X):',
    'https://',
  );
  if (!url || !/^https?:\/\//i.test(url.trim())) {
    alert('URL inválida. Pega una URL que comience con http(s)://');
    return;
  }
  editor
    .chain()
    .focus()
    .deleteSelection()
    .insertIframe({ src: url.trim(), title: 'Video embebido' })
    .run();
}

function highlightMatch(text: string, query: string) {
  const lower = text.toLowerCase();
  const index = lower.indexOf(query.toLowerCase());
  if (index === -1 || query.trim().length === 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <span className="text-accent">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
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
          <div key={item.title}>
            {(index === 0 || item.category !== items[index - 1]?.category) && (
              <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {item.category}
              </div>
            )}
            <button
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
          </div>
        ))}
      </div>
    );
  },
);
