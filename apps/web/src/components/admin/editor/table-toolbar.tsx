'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { ReactNode } from 'react';
import {
  ArrowDownToLine,
  ArrowRightToLine,
  Columns3,
  PanelRight,
  PanelTop,
  RectangleHorizontal,
  Rows3,
  Table2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const toolButtonClass = cn(
  'flex h-8 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-muted-foreground transition-colors',
  'hover:bg-muted hover:text-foreground',
);

function findTable(editor: Editor) {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') return { node: $from.node(d), pos: $from.before(d) };
  }
  return null;
}

function findCellColumn(editor: Editor): number | null {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const name = $from.node(d).type.name;
    if (name === 'tableCell' || name === 'tableHeader') return $from.index(d);
  }
  return null;
}

function hasHeaderRow(table: ProseMirrorNode): boolean {
  const firstRow = table.firstChild;
  return Boolean(firstRow && firstRow.firstChild?.type.name === 'tableHeader');
}

function hasHeaderColumn(table: ProseMirrorNode): boolean {
  let rows = 0;
  let headerRows = 0;
  table.forEach((row) => {
    rows += 1;
    if (row.firstChild?.type.name === 'tableHeader') headerRows += 1;
  });
  return rows > 0 && headerRows === rows;
}

function columnAllBorderless(table: ProseMirrorNode, col: number): boolean {
  let cells = 0;
  let borderless = 0;
  table.forEach((row) => {
    const cell = row.child(col);
    if (cell) {
      cells += 1;
      if (cell.attrs.borderless === true) borderless += 1;
    }
  });
  return cells > 0 && borderless === cells;
}

function toggleRounded(editor: Editor) {
  const table = findTable(editor);
  if (!table) return;
  const next = !table.node.attrs.rounded;
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.setNodeMarkup(table.pos, undefined, { ...table.node.attrs, rounded: next });
      return true;
    })
    .run();
}

function toggleColumnBorderless(editor: Editor, col: number) {
  const table = findTable(editor);
  if (!table) return;
  const next = !columnAllBorderless(table.node, col);
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      table.node.forEach((row, rowOffset) => {
        const cell = row.child(col);
        if (!cell) return;
        let cellOffset = 0;
        for (let i = 0; i < col; i += 1) cellOffset += row.child(i).nodeSize;
        const cellPos = table.pos + 1 + rowOffset + 1 + cellOffset;
        tr.setNodeMarkup(cellPos, undefined, { ...cell.attrs, borderless: next });
      });
      return true;
    })
    .run();
}

/**
 * Barra contextual de la tabla: aparece flotando sobre el editor cuando el
 * cursor está dentro de una tabla, con filas/columnas, encabezados y bordes.
 */
export function TableToolbar({ editor }: { editor: Editor }) {
  const table = findTable(editor);
  const col = findCellColumn(editor);
  const headerRow = table ? hasHeaderRow(table.node) : false;
  const headerColumn = table ? hasHeaderColumn(table.node) : false;
  const rounded = table ? Boolean(table.node.attrs.rounded) : false;
  const colBorderless = table && col !== null ? columnAllBorderless(table.node, col) : false;

  const button = (
    label: string,
    icon: ReactNode,
    onClick: () => void,
    active = false,
    danger = false,
  ) => (
    <button
      type="button"
      key={label}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        toolButtonClass,
        active && 'bg-accent/15 text-accent',
        danger && 'text-red-400 hover:text-red-300',
      )}
    >
      {icon}
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed }) => ed.isActive('table')}
      className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-xl"
    >
      {button('Insertar fila abajo', <ArrowDownToLine className="h-4 w-4" />, () =>
        editor.chain().focus().addRowAfter().run(),
      )}
      {button('Insertar columna', <ArrowRightToLine className="h-4 w-4" />, () =>
        editor.chain().focus().addColumnAfter().run(),
      )}
      {button('Eliminar fila', <Rows3 className="h-4 w-4" />, () =>
        editor.chain().focus().deleteRow().run(),
      )}
      {button('Eliminar columna', <Columns3 className="h-4 w-4" />, () =>
        editor.chain().focus().deleteColumn().run(),
      )}
      {button('Eliminar tabla', <Trash2 className="h-4 w-4" />, () =>
        editor.chain().focus().deleteTable().run(),
      )}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      {button(
        'Encabezado de fila',
        <PanelTop className="h-4 w-4" />,
        () => editor.chain().focus().toggleHeaderRow().run(),
        headerRow,
      )}
      {button(
        'Encabezado de columna',
        <PanelRight className="h-4 w-4" />,
        () => editor.chain().focus().toggleHeaderColumn().run(),
        headerColumn,
      )}
      {button(
        'Bordes redondeados',
        <Table2 className="h-4 w-4" />,
        () => toggleRounded(editor),
        rounded,
      )}
      {button(
        'Quitar bordes de esta columna',
        <RectangleHorizontal className="h-4 w-4" />,
        () => col !== null && toggleColumnBorderless(editor, col),
        colBorderless,
      )}
    </BubbleMenu>
  );
}
