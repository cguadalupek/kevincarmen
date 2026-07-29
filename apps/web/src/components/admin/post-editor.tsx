'use client';

import { useCallback, useEffect, useRef } from 'react';
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
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch {
      // silently skip failed uploads in batch
    }
  }
}

export function PostEditor({ content, onChange }: PostEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
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
    </div>
  );
}
