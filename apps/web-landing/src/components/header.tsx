'use client';

import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants, cn } from '@eduai365/ui';
import { NAV_LINKS } from '@/lib/constants';

export function Header() {
  return (
    <header className="glass-panel-dark fixed top-0 z-50 w-full border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="eduAI365 home">
          <Image src="/logo.png" alt="eduAI365 Logo" width={140} height={40} className="h-10 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-body-md font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Hidden per request:
          <Link
            href="/login"
            className="hidden text-body-md font-medium text-white/70 transition-colors hover:text-white sm:inline"
          >
            Sign in
          </Link>
          */}
          <Link
            href="#demo"
            className={cn(buttonVariants({ variant: 'ai', size: 'pill' }), 'font-medium')}
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}
