'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { ChipInput } from '@/components/admin/chip-input';
import { Button } from '@/components/ui/button';
import { api, type ApiSiteHero, type ApiTechCategory } from '@/lib/api/client';

export default function AdminInicioPage() {
  const [hero, setHero] = useState<ApiSiteHero | null>(null);
  const [categories, setCategories] = useState<ApiTechCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [error, setError] = useState('');

  // Edición en línea de categorías / ítems.
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function load() {
    setLoading(true);
    setError('');
    Promise.all([api.getSiteContent(), api.getTech()])
      .then(([site, tech]) => {
        setHero(site.hero);
        setCategories(tech ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function saveHero(e: React.FormEvent) {
    e.preventDefault();
    if (!hero) return;
    setSaving(true);
    setError('');
    try {
      await api.saveSiteContent({ hero });
      await api.revalidateSite();
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el hero');
    } finally {
      setSaving(false);
    }
  }

  async function run(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
      await api.getTech().then((tech) => setCategories(tech ?? []));
      await api.revalidateSite();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la operación');
    }
  }

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setNewCategory('');
    await run(() => api.createTechCategory(name));
  }

  async function renameCategory() {
    if (!editingCategory) return;
    const name = editingCategory.name.trim();
    if (!name) return;
    const id = editingCategory.id;
    setEditingCategory(null);
    await run(() => api.updateTechCategory(id, name));
  }

  async function removeCategory(category: ApiTechCategory) {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}" y sus tecnologías?`)) return;
    await run(() => api.deleteTechCategory(category.id));
  }

  async function moveCategory(index: number, direction: -1 | 1) {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await run(() => api.reorderTech(next.map((c) => c.id)));
  }

  async function addItem(categoryId: string) {
    const name = (newItems[categoryId] ?? '').trim();
    if (!name) return;
    setNewItems({ ...newItems, [categoryId]: '' });
    await run(() => api.createTechItem(name, categoryId));
  }

  async function renameItem() {
    if (!editingItem) return;
    const name = editingItem.name.trim();
    if (!name) return;
    const id = editingItem.id;
    setEditingItem(null);
    await run(() => api.updateTechItem(id, { name }));
  }

  async function removeItem(itemId: string) {
    if (!window.confirm('¿Eliminar esta tecnología?')) return;
    await run(() => api.deleteTechItem(itemId));
  }

  async function moveItem(category: ApiTechCategory, index: number, direction: -1 | 1) {
    const items = [...category.items];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    await run(() => api.reorderTech(undefined, items.map((i) => i.id)));
  }

  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Inicio</h1>
          <p className="text-sm text-muted-foreground">
            Hero del inicio (subtítulo, nombre, roles animados, descripción) y stack de
            tecnologías por categorías.
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
          <div className="space-y-8">
            {/* ── Hero ─────────────────────────────────────────── */}
            <form onSubmit={saveHero} className="glass-card space-y-4 p-5">
              <h2 className="font-semibold">Perfil Hero</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="hero-name" className="mb-1 block text-sm font-medium">
                    Nombre principal
                  </label>
                  <input
                    id="hero-name"
                    value={hero?.name ?? ''}
                    onChange={(e) => setHero(hero ? { ...hero, name: e.target.value } : hero)}
                    className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="hero-tagline" className="mb-1 block text-sm font-medium">
                    Subtítulo (badge)
                  </label>
                  <input
                    id="hero-tagline"
                    value={hero?.tagline ?? ''}
                    onChange={(e) =>
                      setHero(hero ? { ...hero, tagline: e.target.value } : hero)
                    }
                    placeholder="Aprendo • Enseño • Creo • Construyo"
                    className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hero-desc" className="mb-1 block text-sm font-medium">
                  Descripción / Resumen profesional
                </label>
                <textarea
                  id="hero-desc"
                  rows={3}
                  value={hero?.description ?? ''}
                  onChange={(e) =>
                    setHero(hero ? { ...hero, description: e.target.value } : hero)
                  }
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <ChipInput
                  label="Roles animados (cargo / especialidad)"
                  value={hero?.roles ?? []}
                  onChange={(roles) => setHero(hero ? { ...hero, roles } : hero)}
                  placeholder="Escribe un rol y presiona Enter (ej. Profesor de Computación)"
                />
              </div>

              <Button type="submit" variant="accent" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar hero'}
              </Button>
            </form>

            {/* ── Stack de tecnologías ─────────────────────────── */}
            <section className="glass-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Stack de Tecnologías</h2>
                  <p className="text-sm text-muted-foreground">
                    Categorías y tecnologías que se muestran en la sección Tecnologías del inicio.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    placeholder="Nueva categoría (ej. FRONTEND)"
                    className="w-56 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <Button variant="accent" onClick={addCategory} disabled={!newCategory.trim()}>
                    <Plus className="h-4 w-4" /> Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {categories.map((category, categoryIndex) => (
                  <div key={category.id} className="rounded-lg border border-border bg-card/40 p-4">
                    <div className="flex items-center gap-2">
                      {editingCategory?.id === category.id ? (
                        <>
                          <input
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory({ ...editingCategory, name: e.target.value })
                            }
                            onKeyDown={(e) =>
                              e.key === 'Enter' && (e.preventDefault(), renameCategory())
                            }
                            className="w-48 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
                          />
                          <Button variant="accent" size="sm" onClick={renameCategory}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCategory(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">
                            {category.name}
                          </span>
                          <button
                            type="button"
                            aria-label="Editar categoría"
                            onClick={() =>
                              setEditingCategory({ id: category.id, name: category.name })
                            }
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                        <button
                          type="button"
                          aria-label="Subir categoría"
                          disabled={categoryIndex === 0}
                          onClick={() => moveCategory(categoryIndex, -1)}
                          className="rounded-md p-1.5 hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar categoría"
                          disabled={categoryIndex === categories.length - 1}
                          onClick={() => moveCategory(categoryIndex, 1)}
                          className="rounded-md p-1.5 hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar categoría"
                          onClick={() => removeCategory(category)}
                          className="rounded-md p-1.5 text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>

                    <ul className="mt-3 space-y-1.5">
                      {category.items.map((item, itemIndex) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-1.5"
                        >
                          {editingItem?.id === item.id ? (
                            <>
                              <input
                                value={editingItem.name}
                                onChange={(e) =>
                                  setEditingItem({ ...editingItem, name: e.target.value })
                                }
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && (e.preventDefault(), renameItem())
                                }
                                className="w-40 rounded-lg border border-border bg-muted/50 px-2 py-1 text-sm focus:border-accent focus:outline-none"
                              />
                              <Button variant="accent" size="sm" onClick={renameItem}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingItem(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-muted-foreground">{item.name}</span>
                              <button
                                type="button"
                                aria-label="Editar tecnología"
                                onClick={() => setEditingItem({ id: item.id, name: item.name })}
                                className="rounded p-1 text-muted-foreground/70 hover:text-foreground"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          <span className="ml-auto flex items-center gap-0.5">
                            <button
                              type="button"
                              aria-label="Subir tecnología"
                              disabled={itemIndex === 0}
                              onClick={() => moveItem(category, itemIndex, -1)}
                              className="rounded p-1 text-muted-foreground/70 hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              aria-label="Bajar tecnología"
                              disabled={itemIndex === category.items.length - 1}
                              onClick={() => moveItem(category, itemIndex, 1)}
                              className="rounded p-1 text-muted-foreground/70 hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              aria-label="Eliminar tecnología"
                              onClick={() => removeItem(item.id)}
                              className="rounded p-1 text-red-400/80 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={newItems[category.id] ?? ''}
                        onChange={(e) =>
                          setNewItems({ ...newItems, [category.id]: e.target.value })
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), addItem(category.id))
                        }
                        placeholder="Agregar tecnología (ej. Next.js)"
                        className="w-56 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addItem(category.id)}
                        disabled={!(newItems[category.id] ?? '').trim()}
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </AdminAuthGuard>
  );
}