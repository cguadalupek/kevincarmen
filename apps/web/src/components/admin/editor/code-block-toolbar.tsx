'use client';

import { useEffect, useRef, useState } from 'react';
import { type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { CODE_LANGUAGES, getLanguageLabel } from '@/lib/editor/languages';
import { cn } from '@/lib/utils';

interface CodeBlockToolbarProps {
  editor: Editor;
}

export function CodeBlockToolbar({ editor }: CodeBlockToolbarProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    (editor.getAttributes('codeBlock').language as string | undefined) ?? 'plaintext';

  const filtered = CODE_LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectLanguage(id: string) {
    editor.chain().focus().updateAttributes('codeBlock', { language: id }).run();
    setOpen(false);
    setSearch('');
  }

  async function copyCode() {
    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'codeBlock') {
        await navigator.clipboard.writeText(node.textContent);
        return;
      }
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: ed }) => ed.isActive('codeBlock')}
      className="code-block-toolbar"
    >
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-lg">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {getLanguageLabel(currentLanguage)}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {open && (
            <div className="code-lang-menu">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca un idioma..."
                className="code-lang-search"
                autoFocus
              />
              <ul className="code-lang-list">
                {filtered.map((lang) => (
                  <li key={lang.id}>
                    <button
                      type="button"
                      className={cn(
                        'code-lang-item',
                        lang.id === currentLanguage && 'code-lang-item-active',
                      )}
                      onClick={() => selectLanguage(lang.id)}
                    >
                      <span>{lang.label}</span>
                      {lang.id === currentLanguage && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <button
          type="button"
          onClick={copyCode}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Copiar código"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </BubbleMenu>
  );
}
