'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { getLanguageLabel } from '@/lib/editor/languages';
import { highlightCode } from '@/lib/editor/highlight';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'plaintext' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const highlighted = highlightCode(code, language);
  const label = getLanguageLabel(language);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="code-block-copy"
          aria-label="Copiar código"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="code-block-pre">
        <code
          className={`hljs language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}
