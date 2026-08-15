'use client';

import Link from 'next/link';
import { Mail, MessageSquare } from 'lucide-react';
import { siteConfig } from '@kevincarmen/config';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/fade-in';

export function ContactSection() {
  return (
    <section className="py-20" id="contacto">
      <div className="section-container">
        <FadeIn>
          <div className="glass-card relative overflow-hidden p-8 sm:p-12">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-4 section-title">¿Trabajamos juntos?</h2>
              <p className="mt-3 text-muted-foreground">
                Si tienes un proyecto, consulta o simplemente quieres conectar, estaré encantado
                de escucharte.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Button variant="accent" size="lg" asChild>
                  <Link href="/contacto">Enviar mensaje</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href={`mailto:${siteConfig.email}`}>
                    <Mail className="h-4 w-4" />
                    {siteConfig.email}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
