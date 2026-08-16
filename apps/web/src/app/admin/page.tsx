'use client';

import Link from 'next/link';
import {
  FileText,
  FolderOpen,
  GraduationCap,
  FlaskConical,
  Plus,
  Settings,
  Video,
} from 'lucide-react';
import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';

const sections = [
  {
    href: '/admin/posts',
    icon: FileText,
    title: 'Artículos',
    description: 'Crear, editar y publicar entradas del blog',
  },
  {
    href: '/admin/videos',
    icon: Video,
    title: 'Videos del inicio',
    description: 'Enlaces de video que aparecen en la sección "Últimos videos"',
  },
  {
    href: '/admin/projects',
    icon: FolderOpen,
    title: 'Proyectos',
    description: 'Gestionar proyectos del portfolio',
  },
  {
    href: '/admin/courses',
    icon: GraduationCap,
    title: 'Cursos',
    description: 'Cursos publicados en la sección Cursos',
  },
  {
    href: '/admin/lab',
    icon: FlaskConical,
    title: 'Homelab',
    description: 'Servicios self-hosted del lab',
  },
  {
    href: '/admin/settings',
    icon: Settings,
    title: 'Configuración',
    description: 'Título, contacto y redes sociales',
  },
];

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
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="glass-card block p-6 hover-lift"
              >
                <Icon className="h-8 w-8 text-accent" />
                <h2 className="mt-4 font-semibold">{section.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
              </Link>
            );
          })}
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
