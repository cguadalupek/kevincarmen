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

interface PasteMenu {
  kind: 'paste-url' | 'paste-video';
  url: string;
  embedUrl?: string;
  source?: 'youtube' | 'tiktok' | 'twitter' | 'video';
}

function detectVideoEmbed(url: string): PasteMenu | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (/youtube\.com|youtu\.be/.test(hostname)) {
      return { kind: 'paste-video', url, embedUrl: youtubeEmbed(url), source: 'youtube' };
    }
    if (/tiktok\.com/.test(hostname)) {
      return { kind: 'paste-video', url, embedUrl: url, source: 'tiktok' };
    }
    if (/twitter\.com|x\.com/.test(hostname)) {
      return { kind: 'paste-video', url, embedUrl: url, source: 'twitter' };
    }
    if (/\.(mp4|webm|ogg)$/i.test(pathname)) {
      return { kind: 'paste-video', url, embedUrl: url, source: 'video' };
    }
  } catch {
    // ignored
  }
  return null;
}

function youtubeEmbed(url: string) {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? '';
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}

export function PostEditor({ content, onChange }: PostEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [pastePrompt, setPastePrompt] = useState<PasteMenu | null>(null);

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
        if (text !== ' ' || !currentEditor || !isCodeMarkActive(currentEditor)) return false;
        const previousCharacter = view.state.doc.textBetween(Math.max(0, from - 1), from);
        if (previousCharacter !== ' ') return false;

        currentEditor.commands.unsetMark("code");
        currentEditor.commands.insertContent(' ');
        return true;
      },
      handleKeyDown: (_view, event) => {
        const currentEditor = editorRef.current;
        if (!currentEditor) return false;

        if (event.key === ' ' && isCodeMarkActive(currentEditor)) {
          const { $from } = currentEditor.state.selection;
          const previousCharacter = currentEditor.state.doc.textBetween($from.pos - 1, $from.pos);
          if (previousCharacter === ' ') {
            currentEditor.commands.unsetMark("code");
            return true;
          }
        }

        if (
          event.key === 'ArrowRight' &&
          isCodeMarkActive(currentEditor) &&
          currentEditor.state.selection.empty &&
          currentEditor.state.selection.$from.parentOffset ===
            currentEditor.state.selection.$from.parent.content.size
        ) {
          currentEditor.commands.unsetMark("code");
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
          const video = detectVideoEmbed(text);
          if (video) {
            event.preventDefault();
            setPastePrompt(video as never);
            return true;
          }
          const linkOrMentionOrTag = prompt(
            `Pegaste: ${text}\n\n¿Cómo quieres insertarlo?\n1) URL\n2) Mención (@usuario)\n3) Marcado (etiqueta #)`,
            '1',
          );
          if (!linkOrMentionOrTag) return false;
          event.preventDefault();
          const choice = linkOrMentionOrTag.trim();
          if (choice === '1' || /^u(rl)?$/i.test(choice)) {
            editorInstance
              .chain()
              .focus()
              .insertContent(`[${text}](${text})`)
              .run();
          } else if (choice === '2' || /^men/i.test(choice)) {
            const handle = text.split('/').pop() ?? text;
            editorInstance.chain().focus().insertContent(`@${handle}`).run();
          } else {
            const tag = text.split('/').pop() ?? text;
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

function insertVideo(url?: string) {
    if (!editor || !url) return;
    const safeUrl = youtubeEmbed(url) ?? url;
    const title = prompt('Título del video (opcional):', 'Video embebido') ?? 'Video embebido';
    const html = `\n<iframe src="${safeUrl}" title="${title}" width="800" height="450" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n`;
    editor.chain().focus().insertContent(html).run();
    setPastePrompt(null);
  }

  function cancelVideoPrompt() {
    setPastePrompt(null);
  }

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

      {pastePrompt && 'kind' in pastePrompt && pastePrompt.kind === 'paste-video' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-semibold">Insertar video</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Detectamos el siguiente enlace: <span className="break-all text-accent">{pastePrompt.url}</span>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => insertVideo(pastePrompt.embedUrl)}
                className="flex-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Insertar video
              </button>
              <button
                type="button"
                onClick={cancelVideoPrompt}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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

function isCodeMarkActive(editor: Editor) {
  const codeMark = editor.schema.marks.code;
  if (!codeMark) return false;
  return editor.state.selection.$from.marks().some((mark) => mark.type === codeMark);
}

