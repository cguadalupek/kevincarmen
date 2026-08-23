'use client';

import type { Editor } from '@tiptap/react';
import { Bold, Code2, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Underline, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FormattingToolbar({ editor }: { editor: Editor }) {
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
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 border-b border-border bg-card/95 p-2 backdrop-blur-sm" role="toolbar" aria-label="Formato del artículo">
      {items.map(({ label, icon: Icon, active, run }) => (
        <button key={label} type="button" onClick={run} title={label} aria-label={label} aria-pressed={active} className={cn('rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', active && 'bg-accent/15 text-accent')}>
          <Icon className="h-4 w-4" />
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-border" />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Deshacer" aria-label="Deshacer" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Undo2 className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Rehacer" aria-label="Rehacer" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Redo2 className="h-4 w-4" /></button>
    </div>
  );
}
