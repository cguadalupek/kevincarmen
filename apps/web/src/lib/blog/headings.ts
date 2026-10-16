import { slugify } from '@kevincarmen/utils';

/**
 * Encabezado navegable del artículo.
 *
 * Se extrae del markdown del CMS (h2/h3), tanto en sintaxis ATX (`## Título`)
 * como en HTML crudo (`<h2>Título</h2>`, que `rehype-raw` también renderiza).
 */
export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Nodo mínimo de hast: no hace falta depender de `@types/hast`. */
type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const ATX_RE = /^[ \t]{0,3}(#{2,3})[ \t]+(.*\S)[ \t]*$/gm;
const HTML_HEADING_RE = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const HTML_ID_RE = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

/**
 * Encabezados del contenido en orden de documento, con id único.
 *
 * El id es `slugify(texto)` (el mismo slugify que usa el API para las URLs) y
 * se desambigua con `-2`, `-3`… cuando dos encabezados repiten texto. Un id ya
 * presente en el HTML del CMS se respeta.
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const noComments = markdown.replace(/<!--[\s\S]*?-->/g, '');
  const source = stripFencedCode(noComments);
  const masked = maskInlineCode(source);

  const found: { index: number; level: 2 | 3; text: string; explicitId?: string }[] = [];

  ATX_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATX_RE.exec(source)) !== null) {
    const text = plainText(match[2]);
    if (text) found.push({ index: match.index, level: match[1].length === 2 ? 2 : 3, text });
  }

  HTML_HEADING_RE.lastIndex = 0;
  while ((match = HTML_HEADING_RE.exec(masked)) !== null) {
    const text = plainText(match[3]);
    if (!text) continue;
    const idMatch = HTML_ID_RE.exec(match[2]);
    const explicitId = (idMatch?.[1] ?? idMatch?.[2])?.trim();
    found.push({
      index: match.index,
      level: match[1] === '2' ? 2 : 3,
      text,
      explicitId: explicitId || undefined,
    });
  }

  found.sort((a, b) => a.index - b.index);

  const seen = new Map<string, number>();
  return found.map((heading) => {
    const base = heading.explicitId ?? slugify(heading.text) ?? '';
    const key = base || 'seccion';
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return {
      id: count === 0 ? key : `${key}-${count + 1}`,
      text: heading.text,
      level: heading.level,
    };
  });
}

/**
 * Plugin de rehype sin dependencias: asigna a cada h2/h3 el id calculado por
 * `extractHeadings` y el `scroll-mt-24` que compensa el header fijo de 64 px.
 *
 * Se aplica DESPUÉS de `rehype-raw` para que el HTML crudo del CMS ya esté
 * convertido en elementos. Los anchors funcionan sin JavaScript.
 *
 * El emparejamiento es por TEXTO —no por índice— para que un encabezado que
 * `extractHeadings` no vio (p. ej. uno setext, `Título\n--------`) no desplace
 * todos los ids siguientes: ese encabezado recibe un slug propio y la lista
 * sigue alineada.
 */
export function rehypeHeadingIds(headings: TocHeading[]) {
  return function attacher() {
    return function transformer(tree: HastNode) {
      const pending = headings.map((heading) => ({ ...heading, taken: false }));
      const used = new Set(headings.map((heading) => heading.id));

      const visit = (node: HastNode | undefined) => {
        if (!node || typeof node !== 'object') return;

        if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
          const properties = node.properties ?? (node.properties = {});
          const assigned = nodeText(node);
          const match = pending.find((heading) => !heading.taken && sameHeading(heading.text, assigned));

          let id: string;
          if (typeof properties.id === 'string' && properties.id.length > 0) {
            id = properties.id;
          } else if (match) {
            match.taken = true;
            id = match.id;
          } else {
            id = uniqueSlug(assigned, used);
          }

          properties.id = id;
          addClass(properties, 'scroll-mt-24');
        }

        node.children?.forEach(visit);
      };

      visit(tree);
    };
  };
}

function addClass(properties: Record<string, unknown>, name: string) {
  const classes = Array.isArray(properties.className)
    ? (properties.className as string[])
    : typeof properties.className === 'string'
      ? [properties.className]
      : [];
  if (!classes.includes(name)) properties.className = [...classes, name];
}

/** Texto plano de un nodo hast (concatena los `value` de sus descendientes). */
function nodeText(node: HastNode): string {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(nodeText).join('');
}

function normalizeHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\u00a0]+/g, ' ')
    .replace(/[*_`"'«»]/g, '')
    .trim();
}

function sameHeading(a: string, b: string): boolean {
  return normalizeHeading(a) === normalizeHeading(b);
}

function uniqueSlug(text: string, used: Set<string>): string {
  const base = slugify(text) || 'seccion';
  let candidate = base;
  let index = 1;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  used.add(candidate);
  return candidate;
}

/** Quita bloques de código cercados (` ``` ` / `~~~`): dentro no hay encabezados. */
function stripFencedCode(markdown: string): string {
  const out: string[] = [];
  let fenceChar = '';
  let fenceLength = 0;

  for (const line of markdown.split('\n')) {
    const match = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(line);
    if (fenceChar) {
      if (match && match[1][0] === fenceChar && match[1].length >= fenceLength) {
        fenceChar = '';
        fenceLength = 0;
      }
      continue;
    }
    if (match) {
      fenceChar = match[1][0];
      fenceLength = match[1].length;
      continue;
    }
    out.push(line);
  }

  return out.join('\n');
}

/**
 * Tapa los tramos de código en línea conservando la longitud, para que un
 * `<h2>` escrito como ejemplo (`\`<h2>x</h2>\``) no cuente como encabezado
 * sin desplazar los índices del resto del documento.
 */
function maskInlineCode(source: string): string {
  return source.replace(/(`+)([^`\n]*)\1/g, (match) => ' '.repeat(match.length));
}

function plainText(raw: string): string {
  return decodeEntities(
    raw
      .replace(/<[^>]+>/g, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\*\*|__|`|\*/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:lt|#60);/gi, '<')
    .replace(/&(?:gt|#62);/gi, '>')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&(?:nbsp|#160);/gi, ' ');
}
