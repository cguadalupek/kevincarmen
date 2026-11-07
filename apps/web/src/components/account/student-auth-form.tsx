'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { localProgressItems, replaceLocalProgress } from '@/lib/course-progress';
import {
  loginStudent,
  registerStudent,
  saveStudentSession,
  syncCloudProgress,
} from '@/lib/api/progress';

/**
 * Formulario de acceso / alta de estudiante.
 *
 * Es la ÚNICA puerta de entrada a una cuenta pública, y existe por una razón
 * concreta: sincronizar el progreso de los cursos. Tras autenticar, el progreso que
 * el visitante acumuló como invitado se sube con `POST /progress/sync` (unión, no
 * reemplazo) y se reescribe el espejo local con la lista resultante, de modo que
 * nada de lo hecho sin cuenta se pierde.
 */
export function StudentAuthForm({
  mode,
  next,
}: {
  mode: 'login' | 'register';
  /** Ruta a la que volver después de entrar (la clase que estaba viendo). */
  next: string;
}) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  // El botón no se habilita hasta que React está montado: un submit nativo antes
  // de la hidratación navegaría a la misma URL y el navegador pondría los campos
  // en la query string (la contraseña acabaría en el historial y en los logs).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const otherHref = `${isRegister ? '/cuenta/ingresar' : '/cuenta/registro'}?next=${encodeURIComponent(next)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);

    try {
      const session = isRegister
        ? await registerStudent(name, email, password)
        : await loginStudent(email, password);

      saveStudentSession(session);

      // Fusión del progreso anónimo con el de la cuenta.
      const local = localProgressItems();
      if (local.length > 0) {
        try {
          const rows = await syncCloudProgress(local);
          replaceLocalProgress(rows);
        } catch {
          // La cuenta ya está creada: si la fusión falla se reintenta en la
          // siguiente visita a una clase (el hook vuelve a sincronizar).
        }
      }

      router.push(next || '/cursos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación');
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card w-full max-w-md p-6 sm:p-8">
      <div className="flex items-center gap-3 text-accent">
        {isRegister ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
        <span className="font-mono text-xs uppercase tracking-wider">
          {isRegister ? '/ crear cuenta' : '/ iniciar sesión'}
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        {isRegister ? 'Guarda tu progreso' : 'Bienvenido de nuevo'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isRegister
          ? 'Una cuenta te sirve para conservar tu avance entre dispositivos. Las clases se leen igual sin cuenta.'
          : 'Entra para recuperar tu progreso de cursos en este dispositivo.'}
      </p>

      <div className="mt-6 space-y-4">
        {isRegister && (
          <div>
            <label htmlFor="student-name" className="mb-1.5 block text-sm font-medium">
              Nombre
            </label>
            <input
              id="student-name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
        )}

        <div>
          <label htmlFor="student-email" className="mb-1.5 block text-sm font-medium">
            Correo
          </label>
          <input
            id="student-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="student-password" className="mb-1.5 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="student-password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
            minLength={isRegister ? 8 : 6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-accent"
          />
          {isRegister && (
            <p className="mt-1.5 text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !mounted}
        className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isRegister ? 'Crear cuenta y sincronizar' : 'Entrar y sincronizar'}
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isRegister ? '¿Ya tienes cuenta?' : '¿Todavía no tienes cuenta?'}{' '}
        <Link href={otherHref} className="font-medium text-accent hover:underline">
          {isRegister ? 'Inicia sesión' : 'Crea una gratis'}
        </Link>
      </p>
    </form>
  );
}
