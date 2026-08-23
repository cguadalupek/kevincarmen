'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { api, type ApiProject } from '@/lib/api/client';

const STATUS_LABELS = { ACTIVE: 'Activo', COMPLETED: 'Completado', IN_PROGRESS: 'En progreso', ARCHIVED: 'Archivado' } as const;
const fieldClass = 'w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:border-accent focus:outline-none';
function emptyProject(): Partial<ApiProject> { return { title: '', slug: '', description: '', longDescription: '', technologies: [], repository: '', demo: '', status: 'IN_PROGRESS', featured: false, coverImage: '' }; }

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]); const [editing, setEditing] = useState<Partial<ApiProject> | null>(null); const [techInput, setTechInput] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState(''); const fileRef = useRef<HTMLInputElement>(null);
  function load() { setLoading(true); api.getProjects().then(setProjects).catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar proyectos')).finally(() => setLoading(false)); }
  useEffect(() => { load(); }, []);
  function edit(item: ApiProject) { setEditing({ ...item }); setTechInput(item.technologies.join(', ')); }
  async function uploadCover(file: File) { setUploading(true); setError(''); try { const result = await api.uploadImage(file); setEditing((current) => current ? { ...current, coverImage: result.url } : current); } catch (e) { setError(e instanceof Error ? e.message : 'Error al subir portada'); } finally { setUploading(false); } }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    const payload = {
      title: editing.title?.trim() ?? '',
      slug: editing.slug?.trim() || undefined,
      description: editing.description?.trim() ?? '',
      longDescription: editing.longDescription?.trim() || undefined,
      technologies: techInput.split(',').map((x) => x.trim()).filter(Boolean),
      repository: editing.repository?.trim() || undefined,
      demo: editing.demo?.trim() || undefined,
      status: editing.status,
      featured: Boolean(editing.featured),
      coverImage: editing.coverImage?.trim() || undefined,
    };
    try {
      if (editing.id) await api.updateProject(editing.id, payload);
      else await api.createProject(payload);
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }
  async function remove(item: ApiProject) { if (!window.confirm(`¿Eliminar el proyecto "${item.title}"?`)) return; try { await api.deleteProject(item.id); load(); } catch (e) { setError(e instanceof Error ? e.message : 'Error al eliminar'); } }
  return <AdminAuthGuard><AdminSidebar /><main className="flex-1 overflow-auto p-8"><div className="mb-6 flex items-center justify-between"><div><Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"><ArrowLeft className="h-4 w-4" /> Dashboard</Link><h1 className="mt-2 text-2xl font-bold">Proyectos</h1><p className="text-sm text-muted-foreground">Publica proyectos con su descripción, tecnologías y enlaces.</p></div><Button variant="accent" onClick={() => setEditing(emptyProject())} disabled={!!editing}><Plus className="h-4 w-4" /> Nuevo proyecto</Button></div>
    {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
    {editing && <form onSubmit={submit} className="glass-card mb-6 space-y-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">{editing.id ? 'Editar proyecto' : 'Nuevo proyecto'}</h2><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar"><X className="h-4 w-4" /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Título<input required value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={fieldClass} /></label><label className="text-sm font-medium">Slug<input value={editing.slug ?? ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="Se genera del título" className={fieldClass} /></label></div><label className="block text-sm font-medium">Descripción corta<textarea required rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={fieldClass} /></label><label className="block text-sm font-medium">Descripción completa<textarea rows={5} value={editing.longDescription ?? ''} onChange={(e) => setEditing({ ...editing, longDescription: e.target.value })} className={fieldClass} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Tecnologías<input value={techInput} onChange={(e) => setTechInput(e.target.value)} placeholder="Next.js, PostgreSQL, Docker" className={fieldClass} /></label><label className="text-sm font-medium">Estado<select value={editing.status ?? 'IN_PROGRESS'} onChange={(e) => setEditing({ ...editing, status: e.target.value as ApiProject['status'] })} className={fieldClass}>{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Repositorio<input type="url" value={editing.repository ?? ''} onChange={(e) => setEditing({ ...editing, repository: e.target.value })} placeholder="https://github.com/..." className={fieldClass} /></label><label className="text-sm font-medium">Demo<input type="url" value={editing.demo ?? ''} onChange={(e) => setEditing({ ...editing, demo: e.target.value })} placeholder="https://..." className={fieldClass} /></label></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-medium">Imagen de portada<div className="flex gap-2"><input value={editing.coverImage ?? ''} onChange={(e) => setEditing({ ...editing, coverImage: e.target.value })} placeholder="URL o sube una imagen" className={fieldClass} /><Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}><Upload className="h-4 w-4" />{uploading ? '...' : 'Subir'}</Button></div></label><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} /></div><label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={editing.featured ?? false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Proyecto destacado</label></div><div className="flex gap-3"><Button type="submit" variant="accent" disabled={saving}><Save className="h-4 w-4" />{saving ? 'Guardando...' : editing.id ? 'Actualizar proyecto' : 'Crear proyecto'}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div></form>}
    {loading ? <div className="text-sm text-muted-foreground">Cargando...</div> : projects.length === 0 ? <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">Aún no hay proyectos.</div> : <div className="space-y-3">{projects.map((item) => <div key={item.id} className="glass-card flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{item.title}</span><span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{STATUS_LABELS[item.status]}</span>{item.featured && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Destacado</span>}</div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => edit(item)}><Pencil className="h-4 w-4" /> Editar</Button><Button variant="outline" size="sm" onClick={() => remove(item)} className="text-red-400"><Trash2 className="h-4 w-4" /> Quitar</Button></div></div>)}</div>}
  </main></AdminAuthGuard>;
}
