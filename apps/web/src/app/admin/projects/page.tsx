'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';

export default function AdminCoursesPage() {
  const router = useRouter();

  function logout() {
    localStorage.removeItem('kc_token');
    router.push('/admin/login');
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Próximamente: Cursos</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          La administración de cursos se habilitó en el CMS. Termina el formulario en
          `apps/web/src/app/admin/courses/page.tsx` para empezar a listar cursos.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
