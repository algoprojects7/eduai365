'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { RevealOnScroll } from '@eduai365/ui';

export function SalesInfo() {
  return (
    <section id="sales" className="section-white relative px-4 py-20 md:px-8 md:py-24 border-t border-gray-300/10">
      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-label-md font-medium text-ai-electric">Get in Touch</p>
          <h2 className="mt-2 text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
            Talk to our Sales Team
          </h2>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            Ready to transform your school operations? Reach out to our team directly.
          </p>
        </RevealOnScroll>

        <div className="mx-auto max-w-5xl">
          {/* Main Headquarters / Primary Contacts */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <RevealOnScroll className="h-full">
              <motion.article
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-card transition-all duration-300 md:p-8"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="icon-gh-box mb-6 h-10 w-10">
                  <ShieldCheck className="h-5 w-5 text-ai-violet" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-title-lg font-bold text-on-surface">eduAI365 - School OS</h3>
                <p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">
                  Guwahati, Assam, India
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ai-violet/10 text-ai-violet">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wider">
                        Mobile / WhatsApp
                      </p>
                      <div className="flex flex-col gap-0.5">
                        <a
                          href="https://wa.me/916003526521"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-body-md font-bold text-secondary hover:text-secondary-container transition-colors"
                        >
                          +91 - 60035 26521
                        </a>
                        <a
                          href="https://wa.me/918638526521"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-body-md font-bold text-secondary hover:text-secondary-container transition-colors"
                        >
                          +91 - 8638526521
                        </a>

                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ai-cyan/10 text-ai-cyan">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wider">
                        Email Address
                      </p>
                      <a
                        href="mailto:app@algoguido.com"
                        className="text-body-md font-bold text-secondary hover:text-secondary-container transition-colors"
                      >
                        app@algoguido.com
                      </a>
                    </div>
                  </div>
                </div>
              </motion.article>
            </RevealOnScroll>

            <RevealOnScroll className="h-full">
              <motion.article
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-card transition-all duration-300 md:p-8"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="icon-gh-box mb-6 h-10 w-10">
                  <MapPin className="h-5 w-5 text-ai-cyan" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-title-lg font-bold text-on-surface">Corporate Headquarters</h3>
                <p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">
                  Located in the education and technology hub of Northeast India.
                </p>
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <p className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wider">
                    Office Address
                  </p>
                  <div className="mt-1 text-body-md font-medium text-on-surface">
                    <p className="font-bold text-on-surface">Algoguido Technologies Private Limited</p>
                    <p className="text-on-surface-variant/80 mt-0.5">AEC Road, Jalukbari, Guwahati, Assam, India</p>
                  </div>
                  <p className="mt-2 text-body-sm text-on-surface-variant/75">
                    Monday — Sunday: 9:00 AM to 7:00 PM (IST)
                  </p>
                </div>
              </motion.article>
            </RevealOnScroll>
          </div>

        </div>
      </div>
    </section>
  );
}
