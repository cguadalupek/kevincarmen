'use client';

import { useEffect, useState } from 'react';
import { LabForm } from '@/components/admin/lab-form';
import { api, type ApiLabExperiment } from '@/lib/api/client';

export default function AdminLabEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [experiment, setExperiment] = useState<ApiLabExperiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id: value }) => setId(value));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    api
      .getLabExperiment(id)
      .then(setExperiment)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !id) {
    return <>Cargando…</>;
  }

  if (error || !experiment) {
    return <>{error || 'No encontrado'}</>;
  }

  return (
    <>
      <LabForm experiment={experiment} />
    </>
  );
}
