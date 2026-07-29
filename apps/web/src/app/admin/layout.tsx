import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CMS Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen bg-background">{children}</div>;
}
