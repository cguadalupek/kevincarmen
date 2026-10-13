'use client';

import { PostForm } from '@/components/admin/post-form';

export default function NewPostPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Nuevo artículo</h1>
        <p className="text-muted-foreground">Crea una nueva entrada para el blog</p>
      </div>
      <PostForm />
    </>
  );
}
