'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Edit3, Plus, Tags, Trash2, X } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import type { ApiSubcategory, CategoryTreeNode } from '@/lib/api/categories';
import { categoryColor } from '@/lib/categories';

const FIELD =
  'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50';

// Convierte "Redes & Seguridad" → "redes-seguridad" (misma regla que el backend).
function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
}

const EMPTY_FORM: CategoryFormState = { name: '', slug: '', description: '' };

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [showNewMain, setShowNewMain] = useState(false);
  const [mainForm, setMainForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [editingMain, setEditingMain] = useState<CategoryTreeNode | null>(null);

  // Formulario de subcategoría: null = cerrado; mainId = crear; {mainId, sub} = editar.
  const [subTarget, setSubTarget] = useState<{ mainId: string; sub?: ApiSubcategory } | null>(null);
  const [subForm, setSubForm] = useState<CategoryFormState>(EMPTY_FORM);

  const load = useCallback(() => {
    setBusy(true);
    api
      .getCategoryTree()
      .then(setTree)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'))
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNewMain() {
    setError('');
    setShowNewMain(true);
    setEditingMain(null);
    setMainForm(EMPTY_FORM);
  }

  function openEditMain(node: CategoryTreeNode) {
    setError('');
    setShowNewMain(true);
    setEditingMain(node);
    setMainForm({
      name: node.label,
      slug: node.value,
      description: node.description ?? '',
    });
  }

  async function saveMain(e: React.FormEvent) {
    e.preventDefault();
    if (!mainForm.name.trim() || !mainForm.slug.trim()) {
      setError('Nombre y slug son obligatorios.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: mainForm.name.trim(),
        slug: mainForm.slug.trim(),
        description: mainForm.description.trim() || undefined,
      };
      if (editingMain) await api.updateCategory(editingMain.id, payload);
      else await api.createCategory(payload);
      setShowNewMain(false);
      setEditingMain(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  async function removeMain(node: CategoryTreeNode) {
    if (!confirm(`Eliminar la categoría "${node.label}"?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.deleteCategory(node.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setBusy(false);
    }
  }

  function openNewSub(mainId: string) {
    setError('');
    setSubTarget({ mainId });
    setSubForm(EMPTY_FORM);
  }

  function openEditSub(mainId: string, sub: ApiSubcategory) {
    setError('');
    setSubTarget({ mainId, sub });
    setSubForm({ name: sub.name, slug: sub.slug, description: sub.description ?? '' });
  }

  async function saveSub(e: React.FormEvent) {
    e.preventDefault();
    if (!subTarget) return;
    if (!subForm.name.trim() || !subForm.slug.trim()) {
      setError('Nombre y slug son obligatorios.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: subForm.name.trim(),
        slug: subForm.slug.trim(),
        description: subForm.description.trim() || undefined,
      };
      if (subTarget.sub) await api.updateSubcategory(subTarget.sub.id, payload);
      else {
        await api.createSubcategory({
          mainCategoryId: subTarget.mainId,
          ...payload,
          position: 999,
        });
      }
      setSubTarget(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  async function removeSub(mainId: string, sub: ApiSubcategory) {
    if (!confirm(`Eliminar la subcategoría "${sub.name}"?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.deleteSubcategory(sub.id);
      void mainId;
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setBusy(false);
    }
  }

  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-muted-foreground">
            Crea y organiza tus propias categorías principales y subcategorías. Se reflejan al
            instante en el blog y en el formulario de artículos.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {busy && <p className="mb-4 text-sm text-muted-foreground">Guardando…</p>}

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categorías principales</h2>
          <Button type="button" variant="accent" onClick={openNewMain}>
            <Plus className="h-4 w-4" />
            Nueva categoría
          </Button>
        </div>

        {showNewMain && (
          <form onSubmit={saveMain} className="glass-card mb-8 space-y-4 p-5">
            <h3 className="font-semibold">
              {editingMain ? `Editar "${editingMain.label}"` : 'Nueva categoría principal'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <input
                  value={mainForm.name}
                  onChange={(e) =>
                    setMainForm({
                      ...mainForm,
                      name: e.target.value,
                      // Auto-slug solo mientras no se haya editado el slug a mano.
                      slug:
                        mainForm.slug === toSlug(mainForm.name)
                          ? toSlug(e.target.value)
                          : mainForm.slug,
                    })
                  }
                  placeholder="Sistemas & Cloud"
                  className={FIELD}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug (URL)</label>
                <input
                  value={mainForm.slug}
                  onChange={(e) => setMainForm({ ...mainForm, slug: e.target.value })}
                  placeholder="sistemas-cloud"
                  className={`${FIELD} font-mono`}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Descripción</label>
              <textarea
                value={mainForm.description}
                onChange={(e) => setMainForm({ ...mainForm, description: e.target.value })}
                rows={2}
                className={`${FIELD} resize-none`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewMain(false);
                  setEditingMain(null);
                  setError('');
                }}
              >
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button type="submit" variant="accent" disabled={busy}>
                <Check className="h-4 w-4" /> {editingMain ? 'Guardar cambios' : 'Crear categoría'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {tree.length === 0 && !busy && (
            <p className="text-muted-foreground">Aún no hay categorías.</p>
          )}

          {tree.map((node) => (
            <section key={node.id} className="glass-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${categoryColor(node.value)}`}
                    >
                      {node.label}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">/{node.value}</span>
                  </div>
                  {node.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{node.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {node.subcategories.length} subcategoría
                    {node.subcategories.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditMain(node)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-accent"
                    aria-label="Editar categoría"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMain(node)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-red-400"
                    aria-label="Eliminar categoría"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openNewSub(node.id)}
                  >
                    <Plus className="h-4 w-4" /> Subcategoría
                  </Button>
                </div>
              </div>

              {node.subcategories.length > 0 && (
                <ul className="mt-4 divide-y divide-border border-t border-border pt-2">
                  {node.subcategories.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{sub.name}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          /{sub.slug}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditSub(node.id, sub)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-accent"
                          aria-label="Editar subcategoría"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSub(node.id, sub)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-red-400"
                          aria-label="Eliminar subcategoría"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {subTarget && (
          <form
            onSubmit={saveSub}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <div className="glass-card w-full max-w-md space-y-4 p-6">
              <h3 className="font-semibold">
                {subTarget.sub ? 'Editar subcategoría' : 'Nueva subcategoría'}
              </h3>
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <input
                  value={subForm.name}
                  onChange={(e) =>
                    setSubForm({
                      ...subForm,
                      name: e.target.value,
                      slug:
                        subForm.slug === toSlug(subForm.name)
                          ? toSlug(e.target.value)
                          : subForm.slug,
                    })
                  }
                  placeholder="Despliegues en Kubernetes"
                  className={FIELD}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug (URL)</label>
                <input
                  value={subForm.slug}
                  onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })}
                  className={`${FIELD} font-mono`}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Descripción</label>
                <textarea
                  value={subForm.description}
                  onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                  rows={2}
                  className={`${FIELD} resize-none`}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubTarget(null);
                    setError('');
                  }}
                >
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button type="submit" variant="accent" disabled={busy}>
                  <Check className="h-4 w-4" />{' '}
                  {subTarget.sub ? 'Guardar cambios' : 'Crear subcategoría'}
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-10 rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2 text-foreground">
            <Tags className="h-3.5 w-3.5" /> Notas
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Una categoría con artículos o subcategorías no se puede eliminar hasta que esos
              artículos cambien de categoría (evita borrados accidentales con contenido).
            </li>
            <li>
              El color del badge es estable por slug: la misma categoría siempre tiene el mismo
              color aunque edites su nombre.
            </li>
            <li>
              Los enlaces con los slugs antiguos (
              <code className="rounded bg-muted px-1">?category=redes</code>) siguen funcionando.
            </li>
          </ul>
        </div>
      </main>
    </AdminAuthGuard>
  );
}
