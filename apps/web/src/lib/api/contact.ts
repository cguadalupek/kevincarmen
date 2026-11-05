const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

/** Datos del formulario público de contacto. */
export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

/**
 * Nest devuelve `{ message }` (string o array de strings en los 400 de validación).
 * Se normaliza a una sola línea legible para pintarla en el formulario.
 */
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const value = (payload as { message?: unknown }).message;
    if (Array.isArray(value)) return value.filter(Boolean).join(' ');
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

/**
 * `POST /contact` → el API reenvía el mensaje al chat de Telegram.
 * Lanza `Error` con un mensaje en español listo para el usuario.
 */
export async function sendContactMessage(input: ContactMessageInput): Promise<{ success: true }> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(
      extractErrorMessage(
        payload,
        'No se pudo enviar el mensaje. Inténtalo de nuevo en unos minutos.',
      ),
    );
  }

  return (await res.json().catch(() => ({ success: true as const }))) as { success: true };
}
