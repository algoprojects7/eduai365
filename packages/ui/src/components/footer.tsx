import * as React from 'react';
import { cn } from '../lib/cn';

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterProps {
  brand?: React.ReactNode;
  description?: string;
  linkGroups?: FooterLinkGroup[];
  copyright?: string;
  className?: string;
}

export function Footer({
  brand,
  description = 'Powering the future of K-12 administration.',
  linkGroups = [],
  copyright = `© ${new Date().getFullYear()} eduAI365. All rights reserved.`,
  className,
}: FooterProps) {
  return (
    <footer className={cn('bg-primary-container px-6 py-12 text-white md:px-8', className)}>
      <div className="mx-auto grid max-w-container gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          {brand ?? <p className="text-xl font-bold">eduAI365</p>}
          <p className="mt-2 text-body-md text-white/70">{description}</p>
          <p className="mt-4 text-body-md text-white/50">{copyright}</p>
          <p className="mt-2 text-xs text-white/40">
            Powered by <span className="text-gradient-ai font-semibold">Algoguido Technologies Pvt Ltd</span>
          </p>
        </div>
        {linkGroups.map((group) => (
          <div key={group.title}>
            <h4 className="text-label-md uppercase tracking-wider text-white/50">{group.title}</h4>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-body-md text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
