import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import ImageResize from 'tiptap-extension-resize-image';
import { Markdown } from 'tiptap-markdown';
import { createLowlight } from 'lowlight';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { cmsPlaceholder, DEFAULT_CODE_LANGUAGE, type CMSSection } from './cms-sections';
import { Iframe } from './iframe-node';
import { SlashCommand } from './slash-command';
import { KCTable, KCTableCell, KCTableHeader, KCTableView, TableRow } from './table';

/**
 * Configuración centralizada de las extensiones del editor del CMS.
 *
 * Es el ÚNICO sitio donde se añade o retira una capacidad del editor: los cuatro
 * formularios que editan contenido (Artículos, Proyectos, Lab y Cursos) montan
 * `<CMSEditor />`, que a su vez usa `createCMSEditorExtensions`. Las diferencias
 * por sección (texto de ayuda, comandos de `/`) se declaran aquí o en
 * `cms-sections.ts`, nunca en los formularios.
 */

/**
 * Instancia de lowlight con las gramáticas esenciales.
 *
 * Cada gramática se importa una a una desde `highlight.js/lib/languages/*`
 * (nunca la librería completa, que multiplica el bundle del panel) y `xml`
 * arrastra sus alias de highlight.js (html, xhtml, svg, …).
 */
export const editorLowlight = createLowlight();

editorLowlight.register({
  bash,
  css,
  javascript,
  json,
  plaintext,
  python,
  sql,
  typescript,
  xml,
});

export interface CMSEditorExtensionsOptions {
  section: CMSSection;
  /** Sustituye el texto de ayuda por defecto de la sección. */
  placeholder?: string;
}

/**
 * Extensiones del editor, en orden de registro.
 *
 * - `StarterKit` cubre párrafos, H1-H3, negrita/cursiva, listas, citas y regla
 *   horizontal. Trae `codeBlock`, `link` y `underline` propios: se desactivan
 *   aquí para registrarlos una sola vez y con su configuración a la vista.
 * - `TaskList` + `TaskItem` escriben listas de tareas en markdown GFM (`- [ ]`).
 * - Las tablas usan `KCTable` (bordes redondeados, quitar bordes de una columna,
 *   ancho por columna) y se serializan a HTML para no perder atributos.
 */
export function createCMSEditorExtensions({
  section,
  placeholder,
}: CMSEditorExtensionsOptions): Extensions {
  return [
    StarterKit.configure({
      codeBlock: false,
      link: false,
      underline: false,
    }),
    Underline,
    Link.configure({
      autolink: true,
      linkOnPaste: true,
    }),
    CodeBlockLowlight.configure({
      lowlight: editorLowlight,
      defaultLanguage: DEFAULT_CODE_LANGUAGE,
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    ImageResize.configure({
      inline: false,
      minWidth: 120,
      maxWidth: 900,
    }),
    Placeholder.configure({
      placeholder: cmsPlaceholder(section, placeholder),
    }),
    Markdown.configure({
      html: true,
      transformPastedText: true,
      transformCopiedText: true,
    }),
    Iframe,
    SlashCommand.configure({ section }),
    KCTable.configure({ resizable: true, cellMinWidth: 80, View: KCTableView }),
    TableRow,
    KCTableHeader,
    KCTableCell,
  ];
}
