'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label?: string;
}

/**
 * Entrada de chips para listas de texto (stack, tags...).
 * Enter o coma agregan; clic en la X elimina.
 */
export function ChipInput({ value, onChange, placeholder, label }: ChipInputProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const next = draft.trim().replace(/,$/, '');
    if (!next) return;
    if (!value.includes(next)) onChange([...value, next]);
    setDraft('');
  }

  function remove(chip: string) {
    onChange(value.filter((item) => item !== chip));
  }

  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium">{label}</p>}
      <div
        className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2 py-1.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 font-mono text-xs text-accent"
          >
            {chip}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(chip);
              }}
              aria-label={`Quitar ${chip}`}
              className="rounded p-0.5 text-accent/70 hover:text-accent"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {draft.trim() && (
          <button
            type="button"
            onClick={commit}
            aria-label="Agregar"
            className="rounded-md p-1 text-accent hover:bg-accent/10"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
