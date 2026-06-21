'use client';

import { motion } from 'framer-motion';
import { RevealOnScroll } from '@eduai365/ui';

export function CtaSection() {
  return (
    <section id="demo" className="cinematic-dark-shell relative px-4 py-24 md:px-8 md:py-28">
      <div className="cinematic-aurora opacity-80" aria-hidden />
      <RevealOnScroll className="relative z-10 mx-auto max-w-container">
        <div className="ai-glow-border rounded-2xl px-8 py-14 md:px-14 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-label-md font-medium text-ai-cyan">Ready to get started?</p>
            <h2 className="mt-3 text-headline-lg font-bold tracking-[-0.01em] text-gradient-cinematic md:text-display-lg">
              Launch in less than a month.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-body-lg text-white/65">
              Full access from day one. Transparent pricing. Real people ready to help whenever you need.
            </p>

            {/* Redesigned Info Block with WhatsApp & Details */}
            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 text-left sm:grid-cols-2 md:gap-8">
              {/* Left Column: WhatsApp / Instant Chat */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-ai-cyan">
                  Instant Booking via WhatsApp
                </p>
                <h3 className="mt-2 text-title-lg font-bold text-white">Chat with our Team</h3>
                <p className="mt-1 text-body-md text-white/60">
                  Reach out directly on WhatsApp to schedule your personalized live demo.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href="https://wa.me/918638526521?text=Hello%20eduAI365,%20I%20would%20like%20to%20schedule%20a%20live%20demo."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-3 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex flex-col">
                      <span className="text-body-sm font-bold text-white group-hover:text-ai-cyan transition-colors">
                        +91 - 8638526521
                      </span>
                      <span className="text-xs text-white/50">Primary Contact</span>
                    </div>
                    <span className="text-xs font-semibold text-ai-cyan bg-ai-cyan/10 px-2.5 py-1 rounded-full">
                      Online
                    </span>
                  </a>
                  <a
                    href="https://wa.me/916003526521?text=Hello%20eduAI365,%20I%20would%20like%20to%20schedule%20a%20live%20demo."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-3 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex flex-col">
                      <span className="text-body-sm font-bold text-white group-hover:text-ai-cyan transition-colors">
                        +91 - 60035 26521
                      </span>
                      <span className="text-xs text-white/50">Sales Support</span>
                    </div>
                    <span className="text-xs font-semibold text-ai-cyan bg-ai-cyan/10 px-2.5 py-1 rounded-full">
                      Online
                    </span>
                  </a>
                </div>
              </div>

              {/* Right Column: Corporate Info */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Office Details
                  </p>
                  <h3 className="mt-2 text-title-md font-bold text-white">Algoguido Technologies Private Limited</h3>
                  <p className="mt-2 text-body-sm text-white/70">
                    AEC Road, Jalukbari, Guwahati, Assam, India
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Monday — Sunday: 9:00 AM to 7:00 PM (IST)
                    </div>
                    <a
                      href="mailto:eduai365.erp@gmail.com"
                      className="mt-1 inline-flex items-center gap-1.5 text-body-sm font-semibold text-ai-cyan hover:underline"
                    >
                      eduai365.erp@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
