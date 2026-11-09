'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostForm } from '@/components/admin/post-form';
import { api, type ApiPost } from '@/lib/api/client';

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPost(id)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      {loading && (
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl font-bold">Editar artículo</h1>
          <p className="mt-1 text-muted-foreground">Cargando...</p>
        </div>
      )}
      {post && (
        <PostForm
          post={post}
          heading="Editar artículo"
          subtitle="Modifica el contenido y estado de publicación"
        />
      )}
    </>
  );
}
