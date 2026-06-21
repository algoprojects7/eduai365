'use client';

import { motion } from 'framer-motion';
import { Handshake, CheckCircle2 } from 'lucide-react';
import { RevealOnScroll } from '@eduai365/ui';

const FRANCHISE_BENEFITS = [
  {
    title: 'Exclusive Territory Rights',
    desc: 'Get exclusive rights to market and sell eduAI365 in your designated district or region with zero competition.',
  },
  {
    title: 'Complete Training & Onboarding',
    desc: 'Receive comprehensive product training, sales enablement kits, and dedicated onboarding support from our team.',
  },
  {
    title: 'Marketing & Brand Support',
    desc: 'Access co-branded marketing materials, digital campaigns, and lead generation support to accelerate growth.',
  },
  {
    title: 'Attractive Revenue Sharing',
    desc: 'Earn competitive commissions on every school onboarded with transparent revenue-sharing and timely payouts.',
  },
  {
    title: 'Dedicated Partner Manager',
    desc: 'A dedicated partner success manager to help you with demos, technical queries, and closing deals.',
  },
  {
    title: 'Low Investment, High Returns',
    desc: 'Minimal upfront investment with a proven SaaS product, recurring revenue model, and growing EdTech market.',
  },
];

export function FranchiseInfo() {
  return (
    <section id="franchisee" className="section-white relative px-4 py-20 md:px-8 md:py-24 border-t border-gray-300/10">
      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-ai-violet/15 px-3.5 py-1 text-xs font-semibold text-ai-violet uppercase tracking-wider mb-4">
            <Handshake className="h-3.5 w-3.5" />
            Partner With Us
          </div>
          <h2 className="text-headline-md font-bold text-on-surface md:text-headline-lg">
            Become an eduAI365{' '}
            <span className="text-gradient-ai">Franchise Partner</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-body-lg text-on-surface-variant">
            Join India&apos;s fastest-growing EdTech franchise network. Represent eduAI365 in your
            region and help schools embrace AI-powered administration — while building a
            rewarding business.
          </p>
        </RevealOnScroll>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FRANCHISE_BENEFITS.map((benefit, idx) => (
              <RevealOnScroll key={benefit.title} delay={idx * 0.06} className="h-full">
                <motion.article
                  className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-card transition-all duration-300"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <div>
                      <h3 className="text-body-lg font-bold text-on-surface">{benefit.title}</h3>
                      <p className="mt-1.5 text-body-md leading-relaxed text-on-surface-variant">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                </motion.article>
              </RevealOnScroll>
            ))}
          </div>

          {/* Franchise CTA */}
          <RevealOnScroll className="mt-12 text-center">
            <div className="mx-auto max-w-xl rounded-2xl border border-ai-violet/20 bg-gradient-to-br from-ai-violet/5 to-ai-electric/5 p-8">
              <p className="text-body-lg font-semibold text-on-surface">
                Interested in becoming a franchise partner?
              </p>
              <p className="mt-3 text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wider">
                WhatsApp
              </p>
              <div className="mt-2 flex flex-col items-center justify-center gap-1.5">
                <a
                  href="https://wa.me/916003526521"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-title-md font-bold text-secondary hover:text-secondary-container transition-colors"
                >
                  +91 - 60035 26521
                </a>
                <a
                  href="https://wa.me/918638526521"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-title-md font-bold text-secondary hover:text-secondary-container transition-colors"
                >
                  +91 - 8638526521
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
