'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminListCard } from '@/components/admin/admin-list-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { api, type ApiPost } from '@/lib/api/client';
import { formatDate } from '@kevincarmen/utils';

const statusLabels = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  SCHEDULED: 'Programado',
  TRASHED: 'Papelera',
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getPosts()
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, slug: string) {
    if (!confirm('¿Eliminar este artículo?')) return;
    await api.deletePost(id);
    await api.revalidateSite(slug);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <AdminPageHeader
        title="Artículos"
        subtitle="Gestiona las entradas del blog"
        backHref={null}
        action={
          <Button variant="accent" asChild>
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" />
              Nuevo artículo
            </Link>
          </Button>
        }
      />

      {loading && <p className="text-muted-foreground">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && posts.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No hay artículos todavía.</p>
          <Button variant="accent" className="mt-4" asChild>
            <Link href="/admin/posts/new">Crear el primero</Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <AdminListCard
            key={post.id}
            title={post.title}
            badges={
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {statusLabels[post.status]}
              </span>
            }
            meta={
              <>
                <p className="truncate font-mono">/{post.slug}</p>
                <p>Actualizado: {formatDate(post.updatedAt)}</p>
              </>
            }
            actions={
              <>
                {post.status === 'PUBLISHED' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Ver
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/posts/${post.id}`}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(post.id, post.slug)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            }
          />
        ))}
      </div>
    </>
  );
}
