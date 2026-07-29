'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { siteConfig } from '@kevincarmen/config';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { AnimatedRoles } from '@/components/home/animated-roles';
import { FadeIn } from '@/components/motion/fade-in';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="section-container relative">
        <FadeIn>
          <div className="flex flex-col items-center text-center">
            <div className="mb-8">
              <Logo size={80} />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {siteConfig.tagline}
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {siteConfig.name}
            </h1>

            <div className="mt-4">
              <AnimatedRoles />
            </div>

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Desarrollo software, administro infraestructura, enseño tecnología y creo contenido.
              Construyendo soluciones que escalan.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button variant="accent" size="lg" asChild>
                <Link href="/projects">
                  Explorar proyectos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/blog">Leer artículos</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
