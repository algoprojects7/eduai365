import type { Metadata } from 'next';
import '@eduai365/ui/styles';
import './globals.css';
import { ScrollToTop } from '@/components/scroll-to-top';

export const metadata: Metadata = {
  title: 'AI School ERP Software India | School Management System | eduAI365',
  description:
    'eduAI365 is an AI-powered School ERP and School Management System for K-12 institutions. Manage admissions, academics, attendance, transport, finance, communication, and analytics from one platform.',
  keywords:
    'AI School ERP, School ERP Software India, School Management System, K-12 ERP Software, AI Powered School Management Software, Student Information System India, School Administration Software',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-surface">
      <body className="min-h-screen bg-surface font-sans text-on-surface antialiased">
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
