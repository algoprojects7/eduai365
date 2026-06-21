import type { Metadata } from 'next';
import '@eduai365/ui/styles';

export const metadata: Metadata = {
  title: 'eduAI365 — Teacher Portal',
  description: 'eduAI365 teacher dashboard and classroom tools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
