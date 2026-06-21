import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'eduAI365 — Parent Portal',
  description: 'eduAI365 parent guardian dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'eduai365 Parent',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0052d2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
