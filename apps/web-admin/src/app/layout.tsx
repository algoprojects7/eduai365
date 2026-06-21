import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'eduAI365 Admin — Super Admin Portal',
  description: 'eduAI365 multi-tenant platform administration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
