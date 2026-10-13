'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { ChipInput } from '@/components/admin/chip-input';
import { Button } from '@/components/ui/button';
import { api, type ApiSiteAbout } from '@/lib/api/client';

const EMPTY_ABOUT: ApiSiteAbout = {
  bio: [''],
  expertise: [],
  nowTitle: 'Lo que estoy haciendo ahora',
  nowItems: [''],
};

export default function AdminSobreMiPage() {
  const [about, setAbout] = useState<ApiSiteAbout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getSiteContent()
      .then((site) => setAbout(site.about))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!about) return;
    setSaving(true);
    setError('');
    try {
      const cleaned: ApiSiteAbout = {
        bio: about.bio.map((p) => p.trim()).filter(Boolean),
        expertise: about.expertise,
        nowTitle: about.nowTitle.trim(),
        nowItems: about.nowItems.map((i) => i.trim()).filter(Boolean),
      };
      const next = await api.saveSiteContent({ about: cleaned });
      setAbout(next.about);
      await api.revalidateSite();
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function patch(p: Partial<ApiSiteAbout>) {
    setAbout((prev) => (prev ? { ...prev, ...p } : prev));
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Sobre mí</h1>
        <p className="text-sm text-muted-foreground">
          Biografía, áreas de expertise y el bloque &quot;Lo que estoy haciendo ahora&quot; de la
          vista /sobre-mi.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {savedAt && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Guardado a las {savedAt}.
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Biografía ───────────────────────────────────── */}
          <section className="glass-card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Biografía</h2>
                <p className="text-sm text-muted-foreground">
                  Cada párrafo se muestra como un bloque de texto.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => patch({ bio: [...(about?.bio ?? []), ''] })}
              >
                <Plus className="h-3.5 w-3.5" /> Párrafo
              </Button>
            </div>

            {(about?.bio ?? []).map((paragraph, index) => (
              <div key={index} className="flex items-start gap-2">
                <textarea
                  rows={3}
                  value={paragraph}
                  onChange={(e) => {
                    const bio = [...(about?.bio ?? [])];
                    bio[index] = e.target.value;
                    patch({ bio });
                  }}
                  className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Eliminar párrafo"
                  onClick={() => patch({ bio: (about?.bio ?? []).filter((_, i) => i !== index) })}
                  className="rounded-md p-2 text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          {/* ── Áreas de expertise ──────────────────────────── */}
          <section className="glass-card space-y-3 p-5">
            <h2 className="font-semibold">Áreas de expertise</h2>
            <ChipInput
              value={about?.expertise ?? []}
              onChange={(expertise) => patch({ expertise })}
              placeholder="Escribe una tecnología y presiona Enter (ej. Next.js)"
            />
          </section>

          {/* ── Lo que estoy haciendo ahora ─────────────────── */}
          <section className="glass-card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Lo que estoy haciendo ahora</h2>
                <p className="text-sm text-muted-foreground">Título y lista de ítems.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => patch({ nowItems: [...(about?.nowItems ?? []), ''] })}
              >
                <Plus className="h-3.5 w-3.5" /> Ítem
              </Button>
            </div>

            <div>
              <label htmlFor="now-title" className="mb-1 block text-sm font-medium">
                Título del bloque
              </label>
              <input
                id="now-title"
                value={about?.nowTitle ?? ''}
                onChange={(e) => patch({ nowTitle: e.target.value })}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>

            {(about?.nowItems ?? []).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={item}
                  onChange={(e) => {
                    const nowItems = [...(about?.nowItems ?? [])];
                    nowItems[index] = e.target.value;
                    patch({ nowItems });
                  }}
                  className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Eliminar ítem"
                  onClick={() =>
                    patch({ nowItems: (about?.nowItems ?? []).filter((_, i) => i !== index) })
                  }
                  className="rounded-md p-2 text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          <Button type="submit" variant="accent" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Sobre mí'}
          </Button>
        </form>
      )}
    </>
  );
}
