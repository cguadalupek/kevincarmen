'use client';

import type { Editor } from '@tiptap/react';
import { Bold, Code2, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Underline, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const toolButtonClass = cn(
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors',
  'hover:bg-muted hover:text-foreground',
);

/**
 * Barra de formato del editor.
 *
 * - Fondo sólido (bg-card) + z-20: nunca deja translucir el contenido editable por debajo.
 * - Sticky anclado bajo el header del panel en móvil (top-14, h-14 = 56px, z-30) y al
 *   tope en escritorio (no hay header): no queda oculta ni se superpone a la navegación.
 * - overflow-x-auto + botones con shrink-0: en pantallas estrechas la barra NO se rompe a
 *   varias filas ni encoge los iconos; los botones que no caben se deslizan horizontalmente.
 */
export function FormattingToolbar({
  editor,
  topClass = 'top-14 md:top-0',
}: {
  editor: Editor;
  /** Clase de anclaje del `sticky`. Las vistas superpuestas usan `top-0`. */
  topClass?: string;
}) {
  const items = [
    { label: 'Negrita', icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Cursiva', icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Subrayado', icon: Underline, active: editor.isActive('underline'), run: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Tachado', icon: Strikethrough, active: editor.isActive('strike'), run: () => editor.chain().focus().toggleStrike().run() },
    { label: 'Código en línea', icon: Code2, active: editor.isActive('code'), run: () => editor.chain().focus().toggleCode().run() },
    { label: 'Viñetas', icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numerada', icon: ListOrdered, active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Cita', icon: Quote, active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div
      className={cn(
        'sticky z-20 flex items-center gap-1 overflow-x-auto rounded-t-xl border-b border-border bg-card px-2 py-1.5 shadow-sm thin-scrollbar',
        topClass,
      )}
      role="toolbar"
      aria-label="Formato del artículo"
    >
      {items.map(({ label, icon: Icon, active, run }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          title={label}
          aria-label={label}
          aria-pressed={active}
          className={cn(toolButtonClass, active && 'bg-accent/15 text-accent')}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        title="Deshacer"
        aria-label="Deshacer"
        className={toolButtonClass}
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        title="Rehacer"
        aria-label="Rehacer"
        className={toolButtonClass}
      >
        <Redo2 className="h-4 w-4" />
      </button>
    </div>
  );
}