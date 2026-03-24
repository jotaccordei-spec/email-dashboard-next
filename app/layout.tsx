import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Email Marketing — Raiz Educação',
  description: 'Dashboard com upload restrito e persistência em memória.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
