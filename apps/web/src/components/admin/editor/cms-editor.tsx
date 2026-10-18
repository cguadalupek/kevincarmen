'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { api } from '@/lib/api/client';
import {
  CMS_EDITOR_IMAGE_INPUT_ID,
  CMS_SECTIONS,
  DEFAULT_CMS_SECTION,
  type CMSSection,
} from './cms-sections';
import { createCMSEditorExtensions } from './tiptap.config';
import { CodeBlockToolbar } from './code-block-toolbar';
import { FormattingToolbar } from './formatting-toolbar';
import { TableToolbar } from './table-toolbar';

declare module '@tiptap/core' {
  interface Storage {
    markdown: {
      getMarkdown: () => string;
    };
  }
}

export interface CMSEditorProps {
  /** Contenido del editor en markdown (el formato que guarda el CMS). */
  value: string;
  /** Se llama con el markdown completo tras cada cambio. */
  onChange: (markdown: string) => void;
  /** Sección del CMS: define el texto de ayuda y los comandos de `/`. */
  section?: CMSSection;
  /** Texto de ayuda propio (sustituye el de la sección). */
  placeholder?: string;
  /** Sólo lectura, para vistas de previsualización. */
  readOnly?: boolean;
  /** Avisa cuando se pega una URL (el formulario decide qué hacer con ella). */
  onVideoPaste?: (url: string) => void;
  /**
   * Clase de anclaje de la barra de formato. Dentro de una vista superpuesta
   * (modal) el contenedor de scroll arranca bajo la cabecera, así que se pasa
   * `top-0` para que la barra quede pegada al borde superior sin hueco.
   */
  toolbarTopClass?: string;
}

async function insertImageFiles(editor: Editor, files: FileList | File[]) {
  const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
  for (const file of imageFiles) {
    try {
      const { url } = await api.uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: '' }).run();
    } catch {
      // silencio: en un lote, una imagen que falla no debe cortar las demás
    }
  }
}

/**
 * Editor de contenido del CMS.
 *
 * Un único editor TipTap para Artículos, Proyectos, Lab y Cursos: la sección
 * concreta sólo aporta el texto de ayuda y el catálogo de comandos `/`
 * (ver `tiptap.config.ts` y `cms-sections.ts`). El contenido se intercambia
 * siempre en markdown, que es lo que guarda la base de datos.
 */
export function CMSEditor({
  value,
  onChange,
  section = DEFAULT_CMS_SECTION,
  placeholder,
  readOnly = false,
  onVideoPaste,
  toolbarTopClass,
}: CMSEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Último markdown emitido por el propio editor: distingue un cambio de dentro
  // de un `value` que llega de fuera (cargar otra entidad en el mismo montaje).
  const lastEmittedRef = useRef<string | null>(null);

  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);

  const extensions = useMemo(
    () => createCMSEditorExtensions({ ...(placeholder ? { placeholder } : {}), section }),
    [placeholder, section],
  );

  const handleImageInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const editor = editorRef.current;
    const files = e.target.files;
    if (!editor || !files?.length) return;
    await insertImageFiles(editor, files);
    e.target.value = '';
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: 'post-editor-content',
        'aria-label': `${CMS_SECTIONS[section].label}: contenido`,
      },
      handleKeyDown: (_view, event) => {
        const currentEditor = editorRef.current;
        if (!currentEditor) return false;

        // El espacio cierra el fragmento de código EN LÍNEA (sintaxis en caliente
        // y comando `/Código en línea`): si la marca está activa en el cursor y no
        // continúa después de él, se sale de la marca y el espacio entra como texto
        // normal. Con el cursor en medio de un código, el espacio sigue siendo código.
        if (
          event.key === ' ' &&
          currentEditor.isActive('code') &&
          !codeContinuesAt(currentEditor)
        ) {
          currentEditor.commands.unsetMark('code');
          return false;
        }

        if (
          event.key === 'ArrowRight' &&
          isCodeMarkActive(currentEditor) &&
          currentEditor.state.selection.empty &&
          currentEditor.state.selection.$from.parentOffset ===
            currentEditor.state.selection.$from.parent.content.size
        ) {
          currentEditor.commands.unsetMark('code');
          return true;
        }

        return false;
      },
      handleDrop: (view, event) => {
        const editorInstance = editorRef.current;
        if (!editorInstance || !event.dataTransfer?.files.length) return false;

        const hasImage = Array.from(event.dataTransfer.files).some((f) =>
          f.type.startsWith('image/'),
        );
        if (!hasImage) return false;

        event.preventDefault();
        void insertImageFiles(editorInstance, event.dataTransfer.files);
        return true;
      },
      handlePaste: (_view, event) => {
        const editorInstance = editorRef.current;
        if (!editorInstance) return false;

        const text = event.clipboardData?.getData('text/plain')?.trim();
        if (text && /^https?:\/\//i.test(text)) {
          onVideoPaste?.(text);
          event.preventDefault();
          const choice = window.prompt(
            `Pegaste: ${text}\n\n¿Cómo quieres insertarlo?\n1) URL\n2) Mención (@usuario)\n3) Marcado (#etiqueta)`,
            '1',
          );
          const trimmedChoice = (choice ?? '1').trim();
          if (trimmedChoice === '1' || /^u(rl)?$/i.test(trimmedChoice)) {
            editorInstance.chain().focus().insertContent(`[${text}](${text})`).run();
          } else if (trimmedChoice === '2' || /^men/i.test(trimmedChoice)) {
            const handle = text.split('/').filter(Boolean).pop() ?? text;
            editorInstance.chain().focus().insertContent(`@${handle}`).run();
          } else {
            const tag = text.split('/').filter(Boolean).pop() ?? text;
            editorInstance.chain().focus().insertContent(`#${tag}`).run();
          }
          return true;
        }

        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageFiles: File[] = [];
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }

        if (imageFiles.length === 0) return false;

        event.preventDefault();
        void insertImageFiles(editorInstance, imageFiles);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const markdown = ed.storage.markdown.getMarkdown();
      lastEmittedRef.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Reaplica el contenido cuando el `value` cambia por FUERA del editor (cargar
  // otra entidad reutilizando el mismo montaje). Si el cambio viene de teclear,
  // `value` es exactamente lo último emitido y no se toca el documento (así no se
  // pierde el cursor).
  useEffect(() => {
    if (!editor) return;
    if (lastEmittedRef.current === null) {
      lastEmittedRef.current = value;
      return;
    }
    if (value === lastEmittedRef.current) return;
    if (value === editor.storage.markdown.getMarkdown()) {
      lastEmittedRef.current = value;
      return;
    }
    editor.commands.setContent(value || '', { emitUpdate: false });
    lastEmittedRef.current = value;
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) return;

    const updateSelectedImage = () => {
      setSelectedImagePos(editor.isActive('image') ? editor.state.selection.from : null);
    };

    editor.on('selectionUpdate', updateSelectedImage);
    return () => {
      editor.off('selectionUpdate', updateSelectedImage);
    };
  }, [editor]);

  function updateImageCaption(next: string) {
    if (!editor || selectedImagePos === null) return;
    editor.commands.command(({ tr }) => {
      const node = tr.doc.nodeAt(selectedImagePos);
      if (!node || node.type.name !== 'image') return false;
      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, alt: next });
      return true;
    });
  }

  if (!editor) return null;

  return (
    <div className="post-editor">
      {!readOnly && (
        <input
          id={CMS_EDITOR_IMAGE_INPUT_ID}
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
          multiple
          className="hidden"
          onChange={handleImageInput}
        />
      )}

      {!readOnly && (
        <>
          <FormattingToolbar
            editor={editor}
            {...(toolbarTopClass ? { topClass: toolbarTopClass } : {})}
          />
          <CodeBlockToolbar editor={editor} />
          <TableToolbar editor={editor} />
        </>
      )}

      <EditorContent editor={editor} />

      {!readOnly && selectedImagePos !== null && (
        <input
          type="text"
          value={editor.state.doc.nodeAt(selectedImagePos)?.attrs.alt ?? ''}
          onChange={(event) => updateImageCaption(event.target.value)}
          placeholder="Escribe un pie de foto (opcional)..."
          aria-label="Pie de foto opcional"
          className="mx-5 mb-4 w-[calc(100%-2.5rem)] border-0 border-b border-border bg-transparent py-2 text-center text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent"
        />
      )}
    </div>
  );
}

function isCodeMarkActive(editor: Editor) {
  const codeMark = editor.schema.marks.code;
  if (!codeMark) return false;
  return editor.state.selection.$from.marks().some((mark) => mark.type === codeMark);
}

/**
 * ¿La marca de código sigue después del cursor? Si el cursor está en medio de un
 * fragmento (queda código por delante) el espacio forma parte del código; si está
 * al final (o el fragmento aún no se ha escrito) el espacio lo cierra.
 */
function codeContinuesAt(editor: Editor) {
  const codeMark = editor.schema.marks.code;
  if (!codeMark) return false;
  const { $from, to } = editor.state.selection;
  const end = Math.min(to + 1, editor.state.doc.content.size);
  if (end <= $from.pos) return false;
  return editor.state.doc.rangeHasMark($from.pos, end, codeMark);
}
