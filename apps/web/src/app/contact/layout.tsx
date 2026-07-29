import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con Kevin Carmen.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
