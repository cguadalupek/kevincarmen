'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import ImageResize from 'tiptap-extension-resize-image';
import { Markdown } from 'tiptap-markdown';
import { common, createLowlight } from 'lowlight';
import { api } from '@/lib/api/client';
import { SlashCommand } from './editor/slash-command';
import { CodeBlockToolbar } from './editor/code-block-toolbar';

const lowlight = createLowlight(common);

declare module '@tiptap/core' {
  interface Storage {
    markdown: {
      getMarkdown: () => string;
    };
  }
}

interface PostEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

async function insertImageFiles(editor: Editor, files: FileList | File[]) {
  const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
  for (const file of imageFiles) {
    try {
      const { url } = await api.uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: '' }).run();
    } catch {
      // silently skip failed uploads in batch
    }
  }
}

export function PostEditor({ content, onChange }: PostEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  onChangeRef.current = onChange;

  const handleImageInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const editor = editorRef.current;
    const files = e.target.files;
    if (!editor || !files?.length) return;
    await insertImageFiles(editor, files);
    e.target.value = '';
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'powershell',
      }),
      ImageResize.configure({
        inline: false,
        minWidth: 120,
        maxWidth: 900,
      }),
      Placeholder.configure({
        placeholder: 'Escribe tu artículo… Usa / para insertar código o imágenes.',
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      SlashCommand,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'post-editor-content',
      },
      handleTextInput: (view, from, _to, text) => {
        const currentEditor = editorRef.current;
        if (text !== ' ' || !currentEditor || !isInlineCodeActive(currentEditor)) return false;
        const previousCharacter = view.state.doc.textBetween(Math.max(0, from - 1), from);
        if (previousCharacter !== ' ') return false;

        currentEditor.commands.unsetCode();
        currentEditor.commands.insertContent(' ');
        return true;
      },
      handleKeyDown: (_view, event) => {
        const currentEditor = editorRef.current;
        if (event.key === ' ' && currentEditor && isInlineCodeActive(currentEditor)) {
          const { $from } = currentEditor.state.selection;
          const previousCharacter = currentEditor.state.doc.textBetween($from.pos - 1, $from.pos);
          if (previousCharacter === ' ') {
            currentEditor.commands.unsetCode();
            return false;
          }
        }

        if (
          event.key === 'ArrowRight' &&
          currentEditor &&
          isInlineCodeActive(currentEditor) &&
          currentEditor.state.selection.empty &&
          currentEditor.state.selection.$from.parentOffset ===
            currentEditor.state.selection.$from.parent.content.size
        ) {
          currentEditor.commands.unsetCode();
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
      onChangeRef.current(ed.storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

  function updateImageCaption(value: string) {
    if (!editor || selectedImagePos === null) return;
    editor.commands.command(({ tr }) => {
      const node = tr.doc.nodeAt(selectedImagePos);
      if (!node || node.type.name !== 'image') return false;
      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, alt: value });
      return true;
    });
  }

  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (content !== current) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="post-editor">
      <input
        id="post-editor-image-input"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
        multiple
        className="hidden"
        onChange={handleImageInput}
      />

      <CodeBlockToolbar editor={editor} />

      <EditorContent editor={editor} />
      {selectedImagePos !== null && (
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

function isInlineCodeActive(editor: Editor) {
  const codeMark = editor.schema.marks.code;
  if (!codeMark) return false;
  return editor.state.selection.$from.marks().some((mark) => mark.type === codeMark);
}
