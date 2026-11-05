'use client';

import { useState } from 'react';
import type { Metadata } from 'next';
import {
  CheckCircle2,
  Github,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  Music2,
  Send,
  Youtube,
} from 'lucide-react';
import { siteConfig } from '@kevincarmen/config';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/fade-in';
import { sendContactMessage } from '@/lib/api/contact';

const socialLinks = [
  { name: 'YouTube', url: siteConfig.social.youtube, icon: Youtube },
  { name: 'LinkedIn', url: siteConfig.social.linkedin, icon: Linkedin },
  { name: 'GitHub', url: siteConfig.social.github, icon: Github },
  { name: 'TikTok', url: siteConfig.social.tiktok, icon: Music2 },
  { name: 'Instagram', url: siteConfig.social.instagram, icon: Instagram },
  { name: 'Email', url: `mailto:${siteConfig.email}`, icon: Mail },
];

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const EMPTY_FORM = { name: '', email: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);

  const sending = status === 'sending';

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    setStatus('sending');
    setFeedback(null);

    try {
      await sendContactMessage(form);
      // Solo se vacían los campos cuando el API confirma la entrega a Telegram.
      setForm(EMPTY_FORM);
      setStatus('success');
      setFeedback('Gracias por escribirme. Te responderé lo antes posible.');
    } catch (error) {
      setStatus('error');
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el mensaje. Inténtalo de nuevo en unos minutos.',
      );
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setStatus('idle');
    setFeedback(null);
  }

  return (
    <div className="py-16">
      <div className="section-container max-w-2xl">
        <FadeIn>
          <h1 className="section-title">Contacto</h1>
          <p className="section-subtitle">
            Envíame un mensaje o conecta a través de mis redes sociales.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12">
          {status === 'success' ? (
            <div className="glass-card p-8 text-center" role="status" aria-live="polite">
              <CheckCircle2 className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
              <p className="mt-4 text-lg font-medium text-accent">¡Mensaje enviado!</p>
              <p className="mt-2 text-muted-foreground">{feedback}</p>
              <Button variant="outline" className="mt-6 min-h-[44px] w-full" onClick={resetForm}>
                Enviar otro mensaje
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card space-y-6 p-8">
              <fieldset disabled={sending} className="space-y-6 disabled:opacity-70">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    className="min-h-[44px] w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    className="min-h-[44px] w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-medium">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={4000}
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    aria-describedby="message-hint"
                    className="w-full resize-none rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed"
                    placeholder="¿En qué puedo ayudarte?"
                  />
                  <p id="message-hint" className="mt-1 text-xs text-muted-foreground">
                    {form.message.length}/4000 caracteres
                  </p>
                </div>
              </fieldset>

              {status === 'error' && feedback && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {feedback}
                </p>
              )}

              <Button
                type="submit"
                variant="accent"
                className="min-h-[44px] w-full"
                disabled={sending}
                aria-busy={sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                {sending ? 'Enviando…' : 'Enviar mensaje'}
              </Button>
            </form>
          )}
        </FadeIn>

        <FadeIn delay={0.2} className="mt-12">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Redes sociales
          </h2>
          <div className="flex justify-center gap-4">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border p-3 text-muted-foreground transition-all hover:border-accent/50 hover:text-accent"
                  aria-label={link.name}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
