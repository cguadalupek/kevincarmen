import { Table, TableView } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { DOMSerializer, Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';

/**
 * Serializa un nodo TipTap a una cadena HTML (incluye el <colgroup> del ancho
 * de columnas del modo `resizable`, porque `renderHTML` ya lo emite).
 * Corre solo en el navegador (se invoca desde `getMarkdown()` en `onUpdate`).
 */
function nodeToHTML(node: ProseMirrorNode): string {
  const serializer = DOMSerializer.fromSchema(node.type.schema);
  const dom = serializer.serializeFragment(Fragment.from(node));
  const container = document.createElement('div');
  container.appendChild(dom);
  return container.innerHTML;
}

/** Atributo por celda para quitar los bordes de una columna. */
const borderlessCellAttr = {
  borderless: {
    default: false,
    parseHTML: (el: HTMLElement) => el.getAttribute('data-borderless') === 'true',
    renderHTML: (attrs: { borderless?: boolean }) =>
      attrs.borderless ? { 'data-borderless': 'true' } : {},
  },
};

/**
 * TableView del modo resizable que, además de refrescar las columnas, re-aplica
 * el atributo `data-rounded` al <table> cuando cambia (el `update` base solo
 * actualiza el <colgroup>, así que el toggle de bordes redondeados no se veía).
 */
export class KCTableView extends TableView {
  update(node: ProseMirrorNode) {
    const ok = super.update(node);
    if (ok) {
      if (node.attrs.rounded) this.table.setAttribute('data-rounded', 'true');
      else this.table.removeAttribute('data-rounded');
    }
    return ok;
  }
}

export const KCTableCell = TableCell.extend({
  addAttributes() {
    return { ...(this.parent?.() ?? {}), ...borderlessCellAttr };
  },
});

export const KCTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...(this.parent?.() ?? {}), ...borderlessCellAttr };
  },
});

/**
 * Tabla del editor con bordes redondeados opcionales y serialización a HTML
 * (en lugar de GFM) para que persistan rounded/borderless/colwidth/rowspan/colspan.
 */
export const KCTable = Table.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      rounded: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-rounded') === 'true',
        renderHTML: (attrs: { rounded?: boolean }) =>
          attrs.rounded ? { 'data-rounded': 'true' } : {},
      },
    };
  },
  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (s: string) => void; closeBlock: (n: ProseMirrorNode) => void },
          node: ProseMirrorNode,
        ) {
          state.write(nodeToHTML(node));
          if (node.isBlock) state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
});

export { TableRow };
