'use client';

import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { PostForm } from '@/components/admin/post-form';

export default function NewPostPage() {
  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Nuevo artículo</h1>
          <p className="text-muted-foreground">Crea una nueva entrada para el blog</p>
        </div>
        <PostForm />
      </main>
    </AdminAuthGuard>
  );
}
