'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { api, type ApiTimelineEvent } from '@/lib/api/client';

const TYPE_LABELS = {
  EDUCATION: 'Educación',
  WORK: 'Trabajo',
  PROJECT: 'Proyecto',
  ACHIEVEMENT: 'Logro',
} as const;

function emptyEvent(): Partial<ApiTimelineEvent> {
  return {
    year: '',
    title: '',
    description: '',
    type: 'PROJECT',
    position: 0,
  };
}

export default function AdminTimelinePage() {
  const [events, setEvents] = useState<ApiTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<ApiTimelineEvent> | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .getTimelineEvents()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar la timeline'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');

    const payload: Partial<ApiTimelineEvent> = {
      year: (editing.year ?? '').trim(),
      title: (editing.title ?? '').trim(),
      description: (editing.description ?? '').trim(),
      type: editing.type,
      position: editing.position ?? 0,
    };

    try {
      if (editing.id) await api.updateTimelineEvent(editing.id, payload);
      else await api.createTimelineEvent(payload);
      setEditing(null);
      await api.revalidateSite();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: ApiTimelineEvent) {
    if (!window.confirm(`¿Eliminar el hito "${event.title}"?`)) return;
    try {
      await api.deleteTimelineEvent(event.id);
      await api.revalidateSite();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold">Timeline</h1>
            <p className="text-sm text-muted-foreground">
              Agrega, edita o elimina los hitos que se muestran en la sección Timeline del sitio.
            </p>
          </div>
          <Button variant="accent" onClick={() => setEditing(emptyEvent())} disabled={!!editing}>
            <Plus className="h-4 w-4" /> Nuevo hito
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {editing && (
          <form onSubmit={handleSubmit} className="glass-card mb-6 space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing.id ? 'Editar hito' : 'Nuevo hito'}</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar formulario"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Año</label>
                <input
                  value={editing.year ?? ''}
                  onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                  required
                  maxLength={20}
                  placeholder="2026"
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tipo</label>
                <select
                  value={editing.type ?? 'PROJECT'}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      type: e.target.value as ApiTimelineEvent['type'],
                    })
                  }
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Posición</label>
                <input
                  type="number"
                  min={0}
                  value={editing.position ?? 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      position: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                value={editing.title ?? ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Descripción</label>
              <textarea
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="accent" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : editing.id ? 'Actualizar hito' : 'Crear hito'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            Aún no agregaste hitos al timeline.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="glass-card flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm text-accent">{event.year}</span>
                    <span className="font-semibold">{event.title}</span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      {TYPE_LABELS[event.type]}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing({ ...event })}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AdminAuthGuard>
  );
}