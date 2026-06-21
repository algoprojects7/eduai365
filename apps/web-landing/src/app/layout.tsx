import type { Metadata } from 'next';
import '@eduai365/ui/styles';
import './globals.css';

export const metadata: Metadata = {
  title: 'eduAI365 — The Complete University & Higher Education OS',
  description:
    'Empower your university with AI-driven academic insights, automated course scheduling, and seamless campus administration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-surface">
      <body className="min-h-screen bg-surface font-sans text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
