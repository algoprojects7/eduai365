'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Send, Twitter, Phone, Mail } from 'lucide-react';
import { Button, RevealOnScroll } from '@eduai365/ui';

const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Roles', href: '#roles' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const CONNECT_LINKS = [
  { label: 'Book a Demo', href: '#demo' },
  { label: 'Talk to Sales Team', href: '#sales' },
  { label: 'Franchisee', href: '#franchisee' },
];

export function LandingFooter() {
  return (
    <footer className="landing-footer border-t border-white/10 px-4 py-12 text-white md:px-8">
      <div className="mx-auto grid max-w-container gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <RevealOnScroll className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center">
            <Image src="/logo.png" alt="eduAI365 Logo" width={140} height={40} className="h-10 w-auto" />
          </div>
          <p className="mt-3 text-body-md text-white/60">
            AI-driven administration for the next generation of higher education. Unified,
            human-first, and built for every role.
          </p>
        </RevealOnScroll>

        <div>
          <h4 className="text-label-md font-medium text-white">Links</h4>
          <ul className="mt-4 space-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-body-md text-white/60 hover:text-ai-cyan">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-label-md font-medium text-white">Connect</h4>
          <ul className="mt-4 space-y-2">
            {CONNECT_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-body-md text-white/60 hover:text-ai-cyan">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-label-md font-medium text-white">Contact</h4>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-body-md font-bold text-white">eduAI365 - School OS</p>
              <p className="text-body-sm text-white/50">Guwahati, Assam, India</p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ai-violet/15 text-ai-violet">
                <Phone className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  Mobile / WhatsApp
                </p>
                <div className="mt-1 flex flex-col gap-1 text-body-sm">
                  <a
                    href="https://wa.me/916003526521"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-white/80 hover:text-ai-cyan transition-colors"
                  >
                    +91 - 60035 26521
                  </a>
                  <a
                    href="https://wa.me/918638526521"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-white/80 hover:text-ai-cyan transition-colors"
                  >
                    +91 - 8638526521
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ai-cyan/15 text-ai-cyan">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  Email Address
                </p>
                <a
                  href="mailto:eduai365.erp@gmail.com"
                  className="mt-1 block font-bold text-white/80 hover:text-ai-cyan transition-colors text-body-sm"
                >
                  eduai365.erp@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Disabled Subscribe section per request, kept in source code
        <div>
          <h4 className="text-label-md font-medium text-white">Subscribe</h4>
          <p className="mt-3 text-body-md text-white/60">
            Get product updates and education insights.
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              className="h-10 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 text-body-md text-white placeholder:text-white/40 backdrop-blur-md focus:border-ai-electric focus:outline-none focus:ring-1 focus:ring-ai-electric"
            />
            <Button type="submit" variant="ai" size="icon" aria-label="Subscribe">
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        </div>
        */}
      </div>

      <div className="mx-auto mt-8 flex max-w-container flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
        <p className="text-body-md text-white/50 text-center md:text-left">
          © {new Date().getFullYear()} eduAI365. Powering the future of higher education administration.
        </p>
        <p className="text-body-md text-white/50 text-center">
          Powered by <span className="text-gradient-ai font-semibold">Algoguido Technologies Pvt Ltd</span>
        </p>
        <div className="flex items-center gap-4">
          {/* <Link href="https://twitter.com" className="text-white/50 hover:text-ai-cyan" aria-label="Twitter">
            <Twitter className="h-5 w-5" strokeWidth={1.5} />
          </Link> */}
          <Link href="https://linkedin.com" className="text-white/50 hover:text-ai-cyan" aria-label="LinkedIn">
            <Linkedin className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
