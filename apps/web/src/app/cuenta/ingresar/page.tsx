import type { Metadata } from 'next';
import { StudentAuthForm } from '@/components/account/student-auth-form';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Entra para sincronizar tu progreso de los cursos.',
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * Solo se aceptan rutas internas como destino: `next` llega por la URL y un valor
 * absoluto (`//evil.com`) sería un redirect abierto.
 */
function safeNext(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/cursos';
  return value;
}

export default async function StudentLoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <StudentAuthForm mode="login" next={safeNext(next)} />
    </div>
  );
}
