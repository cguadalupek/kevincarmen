'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { api, setToken } from '@/lib/api/client';

const ADMIN_EMAIL = 'admin@kevincarmen.xyz';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

      const trimmedPassword = password.trim();
      if (!trimmedPassword) {
        throw new Error('Ingresa tu contraseña');
      }

    try {
      const { accessToken } = await api.login(email, trimmedPassword);
      setToken(accessToken);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-md space-y-6 p-10 text-center">
        <Logo size={56} className="mx-auto justify-center" />
        <h1 className="text-2xl font-bold">CMS Admin</h1>
        <p className="text-sm text-muted-foreground">
          Panel de administración de KevinCarmen.xyz
        </p>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <input type="hidden" autoComplete="username" value={email} readOnly />

        <div className="text-left">
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Clave de acceso
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Ingresa tu contraseña"
            className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <Button type="submit" variant="accent" className="w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </Button>
      </form>
    </div>
  );
}
