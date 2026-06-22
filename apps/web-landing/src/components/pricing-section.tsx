'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus, ChevronDown, Sparkles } from 'lucide-react';
import { buttonVariants, cn, RevealOnScroll } from '@eduai365/ui';

interface PricingPlan {
  name: string;
  desc: string;
  monthlyPrice: string;
  annualPrice: string;
  billedAnnuallyText: string;
  billedMonthlyText: string;
  ctaText: string;
  ctaHref: string;
  ctaVariant: 'primary' | 'secondary' | 'ai' | 'ghost' | 'destructive' | 'link';
  features: { text: string; included: boolean }[];
  popular?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    desc: 'For single schools starting their AI journey. Student Capacity — 750.',
    monthlyPrice: '₹2,000',
    annualPrice: '₹20,000',
    billedAnnuallyText: 'Billed annually',
    billedMonthlyText: 'Billed monthly',
    ctaText: 'Get Started',
    ctaHref: '#demo',
    ctaVariant: 'ghost',
    popular: false,
    features: [
      { text: 'AI Analytics Hub', included: true },
      { text: 'Automated Timetabling', included: true },
      { text: 'GPS Tracking', included: true },
      { text: 'Dedicated Manager', included: true },
      { text: '24/7 Priority Support', included: true },
      { text: 'Custom AI Model Training', included: true },
    ],
  },
  {
    name: 'Pro',
    desc: 'The most popular plan for growing districts. Student Capacity — 1,500.',
    monthlyPrice: '₹2,500',
    annualPrice: '₹25,000',
    billedAnnuallyText: 'Billed annually',
    billedMonthlyText: 'Billed monthly',
    ctaText: 'Get Started',
    ctaHref: '#demo',
    ctaVariant: 'primary',
    popular: true,
    features: [
      { text: 'AI Analytics Hub', included: true },
      { text: 'Automated Timetabling', included: true },
      { text: 'GPS Tracking', included: true },
      { text: 'Dedicated Manager', included: true },
      { text: '24/7 Priority Support', included: true },
      { text: 'Custom AI Model Training', included: true },
    ],
  },
  {
    name: 'Enterprise',
    desc: 'For large networks and government bodies. Student Capacity — 1,500+.',
    monthlyPrice: 'Negotiated',
    annualPrice: 'Negotiated',
    billedAnnuallyText: 'Negotiation price per year',
    billedMonthlyText: 'Custom volume billing',
    ctaText: 'Contact Sales',
    ctaHref: '#sales',
    ctaVariant: 'secondary',
    popular: false,
    features: [
      { text: 'AI Analytics Hub', included: true },
      { text: 'Automated Timetabling', included: true },
      { text: 'GPS Tracking', included: true },
      { text: 'Dedicated Manager', included: true },
      { text: '24/7 Priority Support', included: true },
      { text: 'Custom AI Model Training', included: true },
    ],
  },
];


const FAQS = [
  {
    question: 'Can we switch plans at any time?',
    answer:
      'Yes, you can upgrade, downgrade, or cancel your plan at any time. When you change plans, any pre-paid annual amounts will be prorated against your new subscription.',
  },
  {
    question: 'What kind of AI support is included?',
    answer:
      'All plans include the complete AI suite across all 27+ modules — AI-powered timetable generation, AI-generated lesson plans, predictive attendance analytics, smart notifications, automated birthday greetings, real-time GPS transport tracking, student safety monitoring via GPS-enabled shoe chips, examination insights, performance forecasting, anomaly detection, and intelligent recommendations. The only difference between plans is the student capacity limit.',
  },
  {
    question: 'How does the GPS student safety monitoring work?',
    answer:
      'The safety system integrates low-power GPS tracking chips with student footwear, synced directly with our real-time school transport module. Parents and school administrators receive instant smart notifications when a student boards/deboards a bus, enters/exits school premises, or moves outside designated zones.',
  },
  {
    question: 'How do the AI-generated lesson plans and timetabling modules work?',
    answer:
      'The AI lesson planner drafts lesson blueprints mapped to school curricula, helping teachers save hours of preparation time. The conflict-free automated timetabling engine builds optimized schedules in seconds, intelligently accounting for class sizes, room availability, and teacher shifts.',
  },
  {
    question: 'Is training provided for teachers, staff, and administrators?',
    answer:
      'Absolutely. We provide personalized training and comprehensive onboarding materials tailored for every campus role — including Principals, Teachers, Transport Managers, Librarians, and Super Admins. Dedicated customer success managers are available for ongoing technical support.',
  },
  {
    question: 'How secure is our school and student data?',
    answer:
      'Data security is our top priority. We use bank-grade end-to-end encryption for data in transit and at rest. Each school operates on an isolated, highly secure database tenant architecture compliant with modern educational privacy standards.',
  },
  {
    question: 'Do you offer discounts for non-profits?',
    answer:
      'Yes, we support educational institutions and registered non-profits with special pricing. Please contact our sales team to verify eligibility and receive a custom discount quote.',
  },
];

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section id="pricing" className="section-white relative px-4 py-20 md:px-8 md:py-24 border-t border-gray-300/10">
      <div className="relative z-10 mx-auto max-w-container">
        {/* Title */}
        <RevealOnScroll className="mb-12 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-ai-violet/15 px-3.5 py-1 text-xs font-semibold text-ai-violet uppercase tracking-wider mb-4">
            <Sparkles className="h-3 w-3" />
            2026 Pricing Update
          </div>
          <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
            Flexible Plans for <span className="text-gradient-ai">Future-Ready</span> Schools
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-on-surface-variant">
            Empower your institution with AI-driven administration. Scale from a single classroom to a
            nationwide network with ease.
          </p>
        </RevealOnScroll>

        {/* Toggle */}
        <RevealOnScroll className="mb-16 flex justify-center">
          <div className="flex items-center gap-4 rounded-full bg-white p-1.5 shadow-sm border border-gray-200">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'rounded-full px-4 py-1.5 text-body-md font-semibold transition-all duration-200',
                billingPeriod === 'monthly'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-1.5 text-body-md font-semibold transition-all duration-200',
                billingPeriod === 'annual'
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              Annual
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                  billingPeriod === 'annual'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/10 text-emerald-600'
                )}
              >
                Save 20%
              </span>
            </button>
          </div>
        </RevealOnScroll>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-stretch mb-24">
          {PLANS.map((plan, i) => {
            const isAnnual = billingPeriod === 'annual';
            const isCustom = plan.monthlyPrice === 'Negotiated' || plan.monthlyPrice === 'Custom';
            const price = isCustom ? 'Negotiated' : isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const subtitle = isAnnual ? plan.billedAnnuallyText : plan.billedMonthlyText;

            return (
              <RevealOnScroll key={plan.name} delay={i * 0.07} className="flex">
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'relative flex w-full flex-col rounded-2xl bg-white p-8 border transition-all duration-300',
                    plan.popular
                      ? 'border-secondary shadow-lg shadow-secondary/5 ring-1 ring-secondary/20'
                      : 'border-gray-200 shadow-card'
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                      Best Value
                    </span>
                  )}

                  <div className="mb-6">
                    <h3 className="text-title-lg font-bold text-on-surface">{plan.name}</h3>
                    <p className="mt-2 text-body-md text-on-surface-variant min-h-[40px]">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="mb-6 min-h-[145px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-display-md md:text-display-lg font-extrabold text-on-surface tracking-tight">
                          {price}
                        </span>
                        {!isCustom && (
                          <span className="text-body-lg text-on-surface-variant">
                            /{isAnnual ? 'yr' : 'mo'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-body-md text-on-surface-variant/80 font-medium">
                        {subtitle}
                      </p>
                    </div>

                    {!isCustom && (
                      <div className="mt-3 rounded-xl bg-surface-faint p-3 border border-gray-100">
                        {isAnnual ? (
                          <div className="text-left">
                            <p className="text-xs font-bold text-emerald-600">
                              Yearly Benefit: Save {plan.name === 'Starter' ? '₹4,000' : '₹5,000'} ({plan.name === 'Starter' ? '16.7%' : '16.7%'} off)
                            </p>
                            <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                              Effective: {plan.name === 'Starter' ? '₹1,667' : '₹2,083'}/mo vs ₹{plan.name === 'Starter' ? '2,000' : '2,500'}/mo
                            </p>
                          </div>
                        ) : (
                          <div className="text-left">
                            <p className="text-xs font-semibold text-ai-violet">
                              Yearly Savings: {plan.name === 'Starter' ? '₹4,000' : '₹5,000'}/yr available
                            </p>
                            <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                              Total: {plan.name === 'Starter' ? '₹24,000' : '₹30,000'}/yr vs {plan.name === 'Starter' ? '₹20,000' : '₹25,000'}/yr
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <a
                    href={plan.ctaHref}
                    className={cn(
                      buttonVariants({ variant: plan.ctaVariant, size: 'pill' }),
                      'w-full py-3 text-base font-semibold text-center mb-8'
                    )}
                  >
                    {plan.ctaText}
                  </a>

                  <div className="mt-auto">
                    <ul className="space-y-4">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className={cn(
                            'flex items-start gap-3 text-body-md',
                            feature.included ? 'text-on-surface' : 'text-on-surface-variant/40 line-through'
                          )}
                        >
                          {feature.included ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                          )}
                          <span className="leading-tight">{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              </RevealOnScroll>
            );
          })}
        </div>

        {/* Comparison Table */}
        <RevealOnScroll className="mb-24 mt-4">
          <div className="mx-auto max-w-4xl">
            <h3 className="text-headline-md font-bold text-center mb-8 text-on-surface">
              Plan Comparison
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-body-md">
                <thead>
                  <tr className="border-b border-gray-100 bg-surface-faint">
                    <th className="px-6 py-4 text-body-md font-bold text-on-surface">Feature</th>
                    <th className="px-6 py-4 text-center text-body-md font-bold text-on-surface">Starter</th>
                    <th className="px-6 py-4 text-center text-body-md font-bold text-secondary">Pro</th>
                    <th className="px-6 py-4 text-center text-body-md font-bold text-on-surface">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { feature: 'Students', starter: '750', pro: '1,500', enterprise: 'Unlimited' },
                    { feature: 'Teachers', starter: 'Included', pro: 'Included', enterprise: 'Included' },
                    { feature: 'Training', starter: '✓', pro: '✓', enterprise: '✓' },
                    { feature: 'Mobile App', starter: '✓', pro: '✓', enterprise: '✓' },
                    { feature: 'WhatsApp Integration', starter: 'Optional', pro: 'Optional', enterprise: 'Custom' },
                    { feature: 'AI Features', starter: '✓', pro: '✓', enterprise: 'Advanced' },
                    { feature: 'Multi-Campus', starter: '✗', pro: '✓', enterprise: '✓' },
                  ].map((row) => (
                    <tr key={row.feature} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-on-surface">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center text-on-surface-variant">{row.starter}</td>
                      <td className="px-6 py-3.5 text-center font-semibold text-on-surface">{row.pro}</td>
                      <td className="px-6 py-3.5 text-center text-on-surface-variant">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </RevealOnScroll>

        {/* FAQ Section */}
        <div id="faq" className="scroll-mt-24" />
        <RevealOnScroll className="max-w-3xl mx-auto">
          <h3 className="text-headline-md font-bold text-center mb-10 text-on-surface">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-body-lg font-semibold text-on-surface hover:bg-gray-50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-on-surface-variant transition-transform duration-300',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="border-t border-gray-100 p-5 text-body-md text-on-surface-variant leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
