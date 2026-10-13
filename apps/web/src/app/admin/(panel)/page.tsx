'use client';

import Link from 'next/link';
import {
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  FlaskConical,
  Plus,
  Settings,
  Video,
} from 'lucide-react';
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
    title: 'Lab',
    description: 'Experimentos documentados que alimentan los videos largos de YouTube',
  },
  {
    href: '/admin/recursos',
    icon: Download,
    title: 'Recursos',
    description: 'Scripts, plantillas y descargas de la sección /recursos',
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
    <>
      {/* Cabecera: título + acción principal */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al panel de administración</p>
        </div>
        <Button variant="accent" asChild className="min-h-[44px] w-full sm:w-auto">
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4" />
            Nuevo artículo
          </Link>
        </Button>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="glass-card flex min-h-[44px] flex-col p-5 hover-lift"
            >
              <Icon className="h-8 w-8 text-accent" />
              <h2 className="mt-4 font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.description}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
