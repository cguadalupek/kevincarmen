'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { api, type ApiLabService } from '@/lib/api/client';

const STATUS_LABELS = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  MAINTENANCE: 'Mantenimiento',
} as const;

function emptyService(): Partial<ApiLabService> {
  return {
    name: '',
    slug: '',
    description: '',
    stack: [],
    icon: '',
    status: 'ONLINE',
    url: '',
    position: 0,
  };
}

export default function AdminLabPage() {
  const [services, setServices] = useState<ApiLabService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<ApiLabService> | null>(null);
  const [stackInput, setStackInput] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .getLabServices()
      .then(setServices)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar servicios'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(emptyService());
    setStackInput('');
  }

  function openEdit(service: ApiLabService) {
    setEditing({ ...service });
    setStackInput(service.stack.join(', '));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');

    const stack = stackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Partial<ApiLabService> = {
      name: (editing.name ?? '').trim(),
      slug: editing.slug?.trim() || undefined,
      description: (editing.description ?? '').trim(),
      stack,
      icon: editing.icon?.trim() || null,
      status: editing.status,
      url: editing.url?.trim() || null,
      position: editing.position ?? 0,
    };

    try {
      if (editing.id) await api.updateLabService(editing.id, payload);
      else await api.createLabService(payload);
      setEditing(null);
      setStackInput('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service: ApiLabService) {
    if (!window.confirm(`¿Eliminar el servicio "${service.name}"?`)) return;
    try {
      await api.deleteLabService(service.id);
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
            <h1 className="mt-2 text-2xl font-bold">Servicios del Homelab</h1>
            <p className="text-sm text-muted-foreground">
              Configura los servicios que se muestran en la sección Homelab.
            </p>
          </div>
          <Button variant="accent" onClick={openCreate} disabled={!!editing}>
            <Plus className="h-4 w-4" /> Nuevo servicio
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
              <h2 className="font-semibold">
                {editing.id ? 'Editar servicio' : 'Nuevo servicio'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Cerrar formulario"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <input
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <input
                  value={editing.slug ?? ''}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="Se genera del nombre si lo dejas vacío"
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
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

            <div>
              <label className="mb-1 block text-sm font-medium">
                Stack (separado por comas)
              </label>
              <input
                value={stackInput}
                onChange={(e) => setStackInput(e.target.value)}
                placeholder="Docker, Postgres, Redis"
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Estado</label>
                <select
                  value={editing.status ?? 'ONLINE'}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as ApiLabService['status'] })
                  }
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Icono (lucide)</label>
                <input
                  value={editing.icon ?? ''}
                  onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                  placeholder="Server"
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">URL pública</label>
                <input
                  value={editing.url ?? ''}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Posición</label>
                <input
                  type="number"
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

            <div className="flex gap-3">
              <Button type="submit" variant="accent" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : editing.id ? 'Actualizar servicio' : 'Crear servicio'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
            Aún no agregaste servicios al homelab.
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="glass-card flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{service.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        service.status === 'ONLINE'
                          ? 'bg-accent/10 text-accent'
                          : service.status === 'OFFLINE'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                      }`}
                    >
                      {STATUS_LABELS[service.status]}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {service.stack.join(' · ')}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service)}
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