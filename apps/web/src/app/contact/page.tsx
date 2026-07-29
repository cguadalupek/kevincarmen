'use client';

import { useState } from 'react';
import type { Metadata } from 'next';
import { Github, Linkedin, Mail, Send, Youtube } from 'lucide-react';
import { siteConfig } from '@kevincarmen/config';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/fade-in';

const socialLinks = [
  { name: 'GitHub', url: siteConfig.social.github, icon: Github },
  { name: 'LinkedIn', url: siteConfig.social.linkedin, icon: Linkedin },
  { name: 'YouTube', url: siteConfig.social.youtube, icon: Youtube },
  { name: 'Email', url: `mailto:${siteConfig.email}`, icon: Mail },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
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
          {submitted ? (
            <div className="glass-card p-8 text-center">
              <p className="text-lg font-medium text-accent">¡Mensaje enviado!</p>
              <p className="mt-2 text-muted-foreground">
                Te responderé lo antes posible. (Integración con API próximamente)
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card space-y-6 p-8">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
                  className="w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
                  rows={5}
                  className="w-full resize-none rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="¿En qué puedo ayudarte?"
                />
              </div>
              <Button type="submit" variant="accent" className="w-full">
                <Send className="h-4 w-4" />
                Enviar mensaje
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
