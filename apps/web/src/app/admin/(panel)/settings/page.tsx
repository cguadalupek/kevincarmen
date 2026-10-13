'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { api } from '@/lib/api/client';

const SETTINGS_FIELDS: { key: string; label: string; placeholder?: string; multiline?: boolean }[] =
  [
    { key: 'site.title', label: 'Título del sitio', placeholder: 'Kevin Carmen' },
    { key: 'site.tagline', label: 'Tagline', placeholder: 'Plataforma personal…' },
    {
      key: 'site.description',
      label: 'Descripción',
      multiline: true,
      placeholder: 'Descripción larga para SEO…',
    },
    { key: 'contact.email', label: 'Email de contacto', placeholder: 'contacto@kevincarmen.xyz' },
    { key: 'social.youtube', label: 'YouTube URL', placeholder: 'https://www.youtube.com/@…' },
    { key: 'social.github', label: 'GitHub URL', placeholder: 'https://github.com/…' },
    { key: 'social.linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/…' },
    { key: 'social.twitter', label: 'X / Twitter URL', placeholder: 'https://x.com/…' },
    { key: 'social.tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@…' },
    { key: 'social.instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/…' },
  ];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getSettings()
      .then((map) => setValues(map ?? {}))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const next = await api.saveSettings(values);
      setValues(next ?? {});
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Configuración"
        subtitle={
          <>
            Valores generales del sitio (título, contacto, redes sociales). Se guardan en la tabla
            <code className="mx-1 rounded bg-muted px-1 font-mono text-xs">settings</code> como
            pares clave/valor.
          </>
        }
      />

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
        <form onSubmit={handleSubmit} className="glass-card space-y-4 p-5">
          {SETTINGS_FIELDS.map((field) => (
            <div key={field.key}>
              <label htmlFor={`s-${field.key}`} className="mb-1 block text-sm font-medium">
                {field.label}
                <span className="ml-2 font-mono text-xs text-muted-foreground">{field.key}</span>
              </label>
              {field.multiline ? (
                <textarea
                  id={`s-${field.key}`}
                  rows={3}
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              ) : (
                <input
                  id={`s-${field.key}`}
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              )}
            </div>
          ))}

          <Button type="submit" variant="accent" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </form>
      )}
    </>
  );
}
