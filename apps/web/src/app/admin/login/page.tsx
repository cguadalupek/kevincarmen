'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { api, setToken } from '@/lib/api/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kevincarmen.xyz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { accessToken } = await api.login(email, password);
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
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size={48} className="mx-auto justify-center" />
          <h1 className="mt-4 text-2xl font-bold">CMS Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Panel de administración de KevinCarmen.xyz
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-4 p-8">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Credenciales por defecto: admin@kevincarmen.xyz / Admin123!
        </p>
      </div>
    </div>
  );
}
