'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignLeft,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  PlayCircle,
  Quote,
  Table2,
  Terminal,
  TerminalSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CMS_EDITOR_IMAGE_INPUT_ID, DEFAULT_CODE_LANGUAGE, type CMSSection } from './cms-sections';

/** Categorías del menú `/` (se pintan como cabeceras del listado). */
export type SlashCategory = 'Básicos' | 'Listas' | 'Estructura' | 'Multimedia' | 'Laboratorio';

export interface SlashCommandItem {
  title: string;
  description: string;
  category: SlashCategory;
  icon: React.ReactNode;
  /** Palabras extra para el filtro (sin acentos y en minúsculas). */
  keywords?: string[];
  command?: (props: { editor: Editor; range: { from: number; to: number } }) => void;
}

/** Normaliza para comparar: sin acentos, sin mayúsculas. */
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Bloque de código con un idioma concreto. */
function codeBlockCommand(language: string) {
  return ({ editor, range }: { editor: Editor; range: { from: number; to: number } }) => {
    editor.chain().focus().deleteRange(range).setNode('codeBlock', { language }).run();
  };
}

/** Comandos disponibles en TODAS las secciones, agrupados por categoría. */
export const slashCommandItems: SlashCommandItem[] = [
  {
    title: 'Párrafo',
    description: 'Texto normal',
    category: 'Básicos',
    icon: <AlignLeft className="h-4 w-4" />,
    keywords: ['texto', 'text'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('paragraph').run();
    },
  },
  {
    title: 'Título 1',
    description: 'Encabezado principal',
    category: 'Básicos',
    icon: <Heading1 className="h-4 w-4" />,
    keywords: ['h1', 'encabezado', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Título 2',
    description: 'Encabezado de sección',
    category: 'Básicos',
    icon: <Heading2 className="h-4 w-4" />,
    keywords: ['h2', 'encabezado', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Título 3',
    description: 'Encabezado de subsección',
    category: 'Básicos',
    icon: <Heading3 className="h-4 w-4" />,
    keywords: ['h3', 'encabezado', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Código en línea',
    description: 'Fragmento de código dentro del texto',
    category: 'Básicos',
    icon: <TerminalSquare className="h-4 w-4" />,
    keywords: ['inline', 'code'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleMark('code').run(),
  },
  {
    title: 'Lista de viñetas',
    description: 'Lista con guiones',
    category: 'Listas',
    icon: <List className="h-4 w-4" />,
    keywords: ['bullets', 'ul', 'puntos'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleList('bulletList', 'listItem').run(),
  },
  {
    title: 'Lista numerada',
    description: 'Lista ordenada',
    category: 'Listas',
    icon: <ListOrdered className="h-4 w-4" />,
    keywords: ['ol', 'numeros', 'ordered'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleList('orderedList', 'listItem').run(),
  },
  {
    title: 'Lista de tareas',
    description: 'Casillas para marcar (checklist)',
    category: 'Listas',
    icon: <ListChecks className="h-4 w-4" />,
    keywords: ['checklist', 'todo', 'tareas', 'checkbox'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Cita',
    description: 'Cita destacada',
    category: 'Estructura',
    icon: <Quote className="h-4 w-4" />,
    keywords: ['blockquote', 'cita'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Bloque de código',
    description: 'Código con resaltado y selector de idioma',
    category: 'Estructura',
    icon: <Code2 className="h-4 w-4" />,
    keywords: ['code', 'snippet', 'codigo'],
    command: codeBlockCommand(DEFAULT_CODE_LANGUAGE),
  },
  {
    title: 'Tabla',
    description: 'Tabla editable de 3×3',
    category: 'Estructura',
    icon: <Table2 className="h-4 w-4" />,
    keywords: ['grid', 'columnas', 'filas'],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: 'Línea divisora',
    description: 'Separador horizontal',
    category: 'Estructura',
    icon: <Minus className="h-4 w-4" />,
    keywords: ['hr', 'divisor', 'separador'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Imagen',
    description: 'Subir una imagen o pegarla',
    category: 'Multimedia',
    icon: <ImageIcon className="h-4 w-4" />,
    keywords: ['foto', 'captura', 'upload'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      document.getElementById(CMS_EDITOR_IMAGE_INPUT_ID)?.click();
    },
  },
  {
    title: 'Video / Embed',
    description: 'YouTube, TikTok, Vimeo o X',
    category: 'Multimedia',
    icon: <PlayCircle className="h-4 w-4" />,
    keywords: ['youtube', 'embed', 'iframe', 'vimeo'],
    command: ({ editor }) => requestVideoEmbed(editor),
  },
];

/**
 * Comandos propios de una sección. Es el punto de extensión para personalizar el
 * menú `/` sin tocar el tronco común (p. ej. Lab, que trabaja con terminal).
 */
export const SECTION_SLASH_COMMANDS: Partial<Record<CMSSection, SlashCommandItem[]>> = {
  lab: [
    {
      title: 'Salida de terminal',
      description: 'Bloque de bash para pegar la salida de un comando',
      category: 'Laboratorio',
      icon: <Terminal className="h-4 w-4" />,
      keywords: ['terminal', 'consola', 'shell', 'salida'],
      command: codeBlockCommand('bash'),
    },
  ],
};

/** Catálogo efectivo del menú `/` para una sección. */
export function slashCommandsFor(section: CMSSection): SlashCommandItem[] {
  return [...slashCommandItems, ...(SECTION_SLASH_COMMANDS[section] ?? [])];
}

/** Filtra por título, descripción o palabras clave (ignorando acentos). */
export function filterSlashCommands(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const q = normalize(query);
  if (!q) return items;
  return items.filter((item) => {
    const haystack = normalize([item.title, item.description, ...(item.keywords ?? [])].join(' '));
    return haystack.includes(q);
  });
}

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Listado del menú `/`: cabeceras por categoría, selección con el ratón y
 * navegación por teclado (↑ ↓ Enter). El posicionamiento flotante lo controla la
 * extensión `SlashCommand` con floating-ui, no este componente.
 */
export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu(
  { items, command },
  ref,
) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSelectedIndex(0), [items]);

  // El listado puede ser más alto que su caja (max-h + scroll): al mover la
  // selección con el teclado, la opción activa tiene que quedar a la vista.
  // Se ajusta sólo el scrollTop del propio menú para no pelear con floating-ui.
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelectorAll<HTMLElement>('button[role="option"]')[selectedIndex];
    if (!list || !active) return;
    const listBox = list.getBoundingClientRect();
    const itemBox = active.getBoundingClientRect();
    if (itemBox.top < listBox.top) list.scrollTop -= listBox.top - itemBox.top;
    else if (itemBox.bottom > listBox.bottom) list.scrollTop += itemBox.bottom - listBox.bottom;
  }, [selectedIndex, items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) return false;
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selectedIndex];
        if (item) command(item);
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
    <div className="slash-menu" ref={listRef} role="listbox" aria-label="Comandos del editor">
      {items.map((item, index) => (
        <div key={`${item.category}-${item.title}`}>
          {(index === 0 || item.category !== items[index - 1]?.category) && (
            <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {item.category}
            </div>
          )}
          <button
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
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
});

function requestVideoEmbed(editor: Editor) {
  if (typeof window === 'undefined') return;
  const url = window.prompt('Pega el enlace del video (YouTube, TikTok, Vimeo o X):', 'https://');
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
