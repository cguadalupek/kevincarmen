import type { Metadata } from 'next';
import ContactPage from '@/app/contact/page';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con Kevin Carmen para colaborar o resolver tus dudas.',
  alternates: { canonical: '/contacto' },
};

export default ContactPage;
