'use client';

import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al panel de administración</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/posts" className="glass-card block p-6 hover-lift">
            <FileText className="h-8 w-8 text-accent" />
            <h2 className="mt-4 font-semibold">Artículos</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Crear, editar y publicar entradas del blog
            </p>
          </Link>
        </div>

        <div className="mt-8">
          <Button variant="accent" asChild>
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" />
              Nuevo artículo
            </Link>
          </Button>
        </div>
      </main>
    </AdminAuthGuard>
  );
}
