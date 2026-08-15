import { ImageResponse } from 'next/og';
import { siteConfig } from '@kevincarmen/config';

export const alt = 'Kevin Carmen - Desarrollo, infraestructura y homelab';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          color: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          padding: '80px',
          width: '100%',
        }}
      >
        <div style={{ color: '#a78bfa', fontSize: 32, marginBottom: 24 }}>KEVIN CARMEN</div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{siteConfig.title}</div>
        <div style={{ color: '#a1a1aa', fontSize: 28, marginTop: 32 }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
