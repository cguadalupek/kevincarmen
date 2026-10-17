import type { MetadataRoute } from 'next';
import { siteConfig } from '@kevincarmen/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'Kevin Carmen',
    description: siteConfig.description,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    lang: 'es',
    dir: 'ltr',
    // Next tipa `purpose` como 'any'|'maskable'|'monochrome', pero la spec W3C y Chrome
    // aceptan la lista 'any maskable' para que el icono sirva también como maskable.
    icons: [
      { src: '/logo192px.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/logo512px.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ] as unknown as MetadataRoute.Manifest['icons'],
  };
}
