import type { Metadata } from 'next';
import { StudentAuthForm } from '@/components/account/student-auth-form';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea una cuenta gratis para guardar tu progreso de los cursos.',
  robots: { index: false, follow: false },
};

interface RegisterPageProps {
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

export default async function StudentRegisterPage({ searchParams }: RegisterPageProps) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <StudentAuthForm mode="register" next={safeNext(next)} />
    </div>
  );
}
