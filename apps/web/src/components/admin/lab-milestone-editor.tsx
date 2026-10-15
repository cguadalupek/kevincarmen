'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ListPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminModal } from '@/components/admin/admin-modal';
import { PostEditor } from '@/components/admin/post-editor';
import {
  newMilestoneId,
  type LabMilestone,
} from '@/lib/lab-milestone';
import { cn } from '@/lib/utils';

const fieldClass =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

interface LabMilestoneEditorProps {
  milestones: LabMilestone[];
  onChange: (next: LabMilestone[]) => void;
}

/**
 * Editor de hitos de la ficha de laboratorio.
 *
 * Muestra los hitos como una línea de tiempo vertical (vista previa del CMS) y
 * abre un modal para crear/editar cada hito: título, descripción breve, tipo de
 * panel y contenido enriquecido (mismo editor Tiptap que el resto del panel).
 */
export function LabMilestoneEditor({ milestones, onChange }: LabMilestoneEditorProps) {
  const [draft, setDraft] = useState<LabMilestone | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  function openNew() {
    setError('');
    setDraft({ id: newMilestoneId(), title: '', summary: '', kind: 'detail', content: '' });
    setEditingIndex(null);
  }

  function openEdit(index: number) {
    setError('');
    setDraft({ ...milestones[index] });
    setEditingIndex(index);
  }

  function close() {
    setDraft(null);
    setEditingIndex(null);
    setError('');
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= milestones.length) return;
    const next = [...milestones];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(milestones.filter((_, i) => i !== index));
  }

  function saveDraft() {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      setError('El título del hito es obligatorio.');
      return;
    }
    const clean: LabMilestone = {
      ...draft,
      title,
      summary: draft.summary.trim(),
      content: draft.content,
    };
    const next = [...milestones];
    if (editingIndex === null) next.push(clean);
    else next[editingIndex] = clean;
    onChange(next);
    close();
  }

  return (
    <>
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Sin hitos todavía. Agrega el primero para construir la línea de tiempo.
          </p>
        ) : (
          <ol className="space-y-1">
            {milestones.map((milestone, index) => {
              const isLast = index === milestones.length - 1;
              return (
                <li key={milestone.id} className="relative flex gap-3">
                  {/* Raíl izquierdo: nodo + línea conectora */}
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold',
                        'border-accent/50 bg-accent/10 text-accent',
                      )}
                    >
                      {index + 1}
                    </span>
                    {!isLast && <span className="w-px flex-1 bg-border" />}
                  </div>

                  <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
                    <p className="truncate text-sm font-medium">{milestone.title}</p>
                    {milestone.summary && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {milestone.summary}
                      </p>
                    )}
                    <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {milestone.summary ? 'Resumen' : 'Hito'}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label="Subir hito"
                        title="Subir"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-accent disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={isLast}
                        aria-label="Bajar hito"
                        title="Bajar"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-accent disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(index)}
                        aria-label={`Editar hito ${milestone.title}`}
                        title="Editar"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label={`Eliminar hito ${milestone.title}`}
                        title="Eliminar"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={openNew}>
          <ListPlus className="h-4 w-4" /> Agregar hito
        </Button>
      </div>

      {draft && (
        <AdminModal
          title={editingIndex === null ? 'Nuevo hito' : 'Editar hito'}
          subtitle="Título, descripción breve y contenido que se mostrará al hacer clic en la línea de tiempo."
          onClose={close}
          maxWidthClass="sm:max-w-3xl"
          footer={
            <>
              <Button type="button" variant="outline" onClick={close}>
                Cancelar
              </Button>
              <Button type="button" variant="accent" onClick={saveDraft}>
                {editingIndex === null ? 'Agregar hito' : 'Guardar hito'}
              </Button>
            </>
          }
        >
          <div className="space-y-4 pt-1">
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="milestone-title" className="mb-2 block text-sm font-medium">
                Título del hito
              </label>
              <input
                id="milestone-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Ej: 01. OBJETIVO / HIPÓTESIS"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="milestone-summary" className="mb-2 block text-sm font-medium">
                Descripción breve{' '}
                <span className="text-muted-foreground">(se muestra en la línea de tiempo)</span>
              </label>
              <textarea
                id="milestone-summary"
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                rows={2}
                placeholder="Una frase que resuma este paso."
                className={cn(fieldClass, 'resize-none')}
              />
            </div>

            <div>
              <label htmlFor="milestone-content" className="mb-2 block text-sm font-medium">
                Contenido / detalles
              </label>
              <PostEditor
                key={draft.id}
                content={draft.content}
                onChange={(content) => setDraft({ ...draft, content })}
                toolbarTopClass="top-0"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </>
  );
}
