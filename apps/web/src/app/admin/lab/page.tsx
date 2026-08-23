'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { api, type ApiLabExperiment } from '@/lib/api/client';

const STATUS_LABELS = { IN_PROGRESS: 'En pruebas', SUCCESS: 'Funcionó', PARTIAL: 'Funcionó con limitaciones', FAILED: 'No funcionó', ABANDONED: 'Abandonado' } as const;
const fieldClass = 'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none';

function emptyExperiment(): Partial<ApiLabExperiment> {
  return { title: '', slug: '', description: '', objective: '', hypothesis: '', environment: '', procedure: '', status: 'IN_PROGRESS', result: '', conclusion: '', stack: [], tags: [], coverImage: '', gallery: [], startedAt: null, completedAt: null };
}

export default function AdminLabPage() {
  const [experiments, setExperiments] = useState<ApiLabExperiment[]>([]);
  const [editing, setEditing] = useState<Partial<ApiLabExperiment> | null>(null);
  const [stackInput, setStackInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function load() { setLoading(true); api.getLabExperiments().then(setExperiments).catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar experimentos')).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, []);
  function edit(item: ApiLabExperiment) { setEditing({ ...item }); setStackInput(item.stack.join(', ')); setTagsInput(item.tags.join(', ')); }
  function update(key: keyof ApiLabExperiment, value: string) { setEditing((current) => current ? { ...current, [key]: value } : current); }
  async function uploadCover(file: File) { setUploading(true); setError(''); try { const result = await api.uploadImage(file); update('coverImage', result.url); } catch (e) { setError(e instanceof Error ? e.message : 'Error al subir portada'); } finally { setUploading(false); } }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    const list = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
    const payload: Partial<ApiLabExperiment> = { ...editing, title: editing.title?.trim(), slug: editing.slug?.trim() || undefined, description: editing.description?.trim(), stack: list(stackInput), tags: list(tagsInput), coverImage: editing.coverImage?.trim() || undefined, startedAt: editing.startedAt?.trim() || undefined, completedAt: editing.completedAt?.trim() || undefined };
    try { if (editing.id) await api.updateLabExperiment(editing.id, payload); else await api.createLabExperiment(payload); setEditing(null); load(); } catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar'); } finally { setSaving(false); }
  }
  async function remove(item: ApiLabExperiment) { if (!window.confirm(`¿Eliminar el experimento "${item.title || 'sin título'}"?`)) return; try { await api.deleteLabExperiment(item.id); load(); } catch (e) { setError(e instanceof Error ? e.message : 'Error al eliminar'); } }

  return <AdminAuthGuard><AdminSidebar /><main className="flex-1 overflow-auto p-8">
    <div className="mb-6 flex items-center justify-between"><div><Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"><ArrowLeft className="h-4 w-4" /> Dashboard</Link><h1 className="mt-2 text-2xl font-bold">Experimentos del Lab</h1><p className="text-sm text-muted-foreground">Documenta pruebas, experimentos y descubrimientos técnicos.</p></div><Button variant="accent" onClick={() => setEditing(emptyExperiment())} disabled={!!editing}><Plus className="h-4 w-4" /> Nuevo experimento</Button></div>
    {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
    {editing && <form onSubmit={submit} className="glass-card mb-6 space-y-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">{editing.id ? 'Editar experimento' : 'Nuevo experimento'}</h2><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar"><X className="h-4 w-4" /></button></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Título<input required value={editing.title ?? ''} onChange={(e) => update('title', e.target.value)} className={fieldClass} /></label><label className="text-sm font-medium">Slug<input value={editing.slug ?? ''} onChange={(e) => update('slug', e.target.value)} placeholder="Se genera del título" className={fieldClass} /></label></div>
      <label className="block text-sm font-medium">Descripción corta<textarea required rows={2} value={editing.description ?? ''} onChange={(e) => update('description', e.target.value)} className={fieldClass} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Imagen de portada<div className="flex gap-2"><input value={editing.coverImage ?? ''} onChange={(e) => update('coverImage', e.target.value)} placeholder="URL o sube una imagen" className={fieldClass} /><Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4" />{uploading ? '...' : 'Subir'}</Button></div></label><div><span className="text-sm font-medium">Vista previa</span>{editing.coverImage && <img src={editing.coverImage} alt="Portada" className="mt-1 h-20 w-32 rounded object-cover" />}</div></div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Objetivo<textarea rows={3} value={editing.objective ?? ''} onChange={(e) => update('objective', e.target.value)} className={fieldClass} /></label><label className="text-sm font-medium">Hipótesis<textarea rows={3} value={editing.hypothesis ?? ''} onChange={(e) => update('hypothesis', e.target.value)} className={fieldClass} /></label><label className="text-sm font-medium">Entorno<textarea rows={3} value={editing.environment ?? ''} onChange={(e) => update('environment', e.target.value)} className={fieldClass} /></label><label className="text-sm font-medium">Procedimiento<textarea rows={3} value={editing.procedure ?? ''} onChange={(e) => update('procedure', e.target.value)} className={fieldClass} /></label></div>
      <div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-medium">Estado<select value={editing.status ?? 'IN_PROGRESS'} onChange={(e) => update('status', e.target.value)} className={fieldClass}>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-sm font-medium">Inicio<input type="date" value={editing.startedAt?.slice(0, 10) ?? ''} onChange={(e) => update('startedAt', e.target.value)} className={fieldClass} /></label><label className="text-sm font-medium">Finalización<input type="date" value={editing.completedAt?.slice(0, 10) ?? ''} onChange={(e) => update('completedAt', e.target.value)} className={fieldClass} /></label></div>
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Resultado<textarea rows={4} value={editing.result ?? ''} onChange={(e) => update('result', e.target.value)} className={fieldClass} /></label><label className="text-sm font-medium">Conclusión<textarea rows={4} value={editing.conclusion ?? ''} onChange={(e) => update('conclusion', e.target.value)} className={fieldClass} /></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Stack / Tecnologías<input value={stackInput} onChange={(e) => setStackInput(e.target.value)} placeholder="Docker, Proxmox, PostgreSQL" className={fieldClass} /></label><label className="text-sm font-medium">Tags<input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="virtualización, hardware" className={fieldClass} /></label></div>
      <div className="flex gap-3"><Button type="submit" variant="accent" disabled={saving}><Save className="h-4 w-4" />{saving ? 'Guardando...' : editing.id ? 'Actualizar experimento' : 'Crear experimento'}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div>
    </form>}
    {loading ? <div className="text-sm text-muted-foreground">Cargando...</div> : experiments.length === 0 ? <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">Aún no hay experimentos.</div> : <div className="space-y-3">{experiments.map((item) => <div key={item.id} className="glass-card flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{item.title || 'Experimento legacy'}</span><span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{STATUS_LABELS[item.status]}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => edit(item)}><Pencil className="h-4 w-4" /> Editar</Button><Button variant="outline" size="sm" onClick={() => remove(item)} className="text-red-400"><Trash2 className="h-4 w-4" /> Quitar</Button></div></div>)}</div>}
  </main></AdminAuthGuard>;
}
