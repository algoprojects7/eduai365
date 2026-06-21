'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  PlayCircle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  ArrowRightCircle,
  HelpCircle,
} from 'lucide-react';
import { buttonVariants, cn, RevealOnScroll } from '@eduai365/ui';

interface Resource {
  id: string;
  type: 'Case Study' | 'Whitepaper' | 'Tutorial' | 'Documentation' | 'Product Update';
  title: string;
  desc: string;
  linkText: string;
  linkHref: string;
  linkType: 'download' | 'play' | 'external';
  visualType: 'efficiency' | 'predictive' | 'timetable' | 'security' | 'outcomes' | 'forecasting';
}

const RESOURCES: Resource[] = [
  {
    id: '1',
    type: 'Case Study',
    title: "Greenfield Academy's 40% Efficiency Gain",
    desc: "Discover how Greenfield Academy eliminated manual data entry across five campuses using eduai365's AI engine.",
    linkText: 'Download PDF',
    linkHref: '#download',
    linkType: 'download',
    visualType: 'efficiency',
  },
  {
    id: '2',
    type: 'Whitepaper',
    title: 'Predictive Analytics in Student Retention',
    desc: 'Identifying at-risk students 3 months earlier through behavioral patterns and academic trend analysis.',
    linkText: 'Download PDF',
    linkHref: '#download',
    linkType: 'download',
    visualType: 'predictive',
  },
  {
    id: '3',
    type: 'Tutorial',
    title: 'Automating Complex Timetables with AI',
    desc: 'A 15-minute walkthrough on configuring the eduai365 Scheduler to handle multi-campus constraints.',
    linkText: 'Watch Now',
    linkHref: '#watch',
    linkType: 'play',
    visualType: 'timetable',
  },
  {
    id: '4',
    type: 'Documentation',
    title: 'District-Wide Security & Compliance',
    desc: 'Technical guide on data encryption, FERPA compliance, and secure API integrations.',
    linkText: 'View Guide',
    linkHref: '#guide',
    linkType: 'external',
    visualType: 'security',
  },
  {
    id: '5',
    type: 'Case Study',
    title: 'Improving Student Outcomes by 22%',
    desc: 'How Summit Districts used AI insights to personalize learning pathways for secondary students.',
    linkText: 'Download PDF',
    linkHref: '#download',
    linkType: 'download',
    visualType: 'outcomes',
  },
  {
    id: '6',
    type: 'Product Update',
    title: 'New: AI Budget Forecasting v2.0',
    desc: 'A deep dive into the new forecasting modules for the HR and Financial portals.',
    linkText: 'Watch Demo',
    linkHref: '#watch',
    linkType: 'external',
    visualType: 'forecasting',
  },
];

const CATEGORIES = [
  'All',
  'Case Studies',
  'Whitepapers',
  'Video Tutorials',
  'Documentation',
  'Product Updates',
];

// Custom Premium Vector SVGs to represent the cover graphics
const ResourceVisual = ({ type }: { type: Resource['visualType'] }) => {
  switch (type) {
    case 'efficiency':
      return (
        <svg className="w-full h-full bg-slate-950" viewBox="0 0 400 220" fill="none">
          <defs>
            <linearGradient id="eff-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0052d2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M50 170 L120 130 L200 150 L280 80 L350 50" stroke="url(#eff-grad)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="350" cy="50" r="6" fill="#22d3ee" className="animate-pulse" />
          <line x1="50" y1="180" x2="350" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
          <text x="60" y="70" fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="sans-serif">EFFICIENCY INDEX</text>
          <text x="60" y="95" fill="#ffffff" fontSize="24" fontFamily="sans-serif" fontWeight="bold">+40%</text>
        </svg>
      );
    case 'predictive':
      return (
        <svg className="w-full h-full bg-slate-950" viewBox="0 0 400 220" fill="none">
          <defs>
            <radialGradient id="pred-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="110" r="70" fill="url(#pred-glow)" />
          <circle cx="200" cy="110" r="40" stroke="rgba(124, 58, 237, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="200" cy="110" r="10" fill="#7c3aed" />
          {/* Nodes */}
          <line x1="200" y1="110" x2="130" y2="70" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <line x1="200" y1="110" x2="280" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <line x1="200" y1="110" x2="230" y2="160" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="130" cy="70" r="6" fill="#1b64f1" />
          <circle cx="280" cy="80" r="6" fill="#22d3ee" />
          <circle cx="230" cy="160" r="6" fill="#ef4444" />
        </svg>
      );
    case 'timetable':
      return (
        <div className="relative w-full h-full bg-slate-950 flex flex-col justify-center px-8 text-white">
          <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-wrap justify-between p-4 gap-1">
            {Array.from({ length: 48 }).map((_, idx) => (
              <div key={idx} className="h-6 w-8 bg-white/10 rounded-sm" />
            ))}
          </div>
          <div className="relative z-10 flex items-center justify-center h-12 w-12 rounded-full bg-primary/80 border border-white/20 mx-auto shadow-md">
            <PlayCircle className="h-8 w-8 text-ai-cyan" />
          </div>
          <p className="text-center mt-3 text-body-sm text-white/50 tracking-wider">AI SCHEDULER</p>
        </div>
      );
    case 'security':
      return (
        <svg className="w-full h-full bg-slate-950" viewBox="0 0 400 220" fill="none">
          <defs>
            <linearGradient id="sec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1b64f1" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect x="150" y="80" width="100" height="70" rx="10" fill="url(#sec-grad)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2" />
          <path d="M175 80 V55 C175 40, 225 40, 225 55 V80" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <circle cx="200" cy="115" r="4" fill="#ffffff" />
          <path d="M200 119 V130" stroke="#ffffff" strokeWidth="2" />
          <circle cx="200" cy="110" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </svg>
      );
    case 'outcomes':
      return (
        <svg className="w-full h-full bg-slate-950" viewBox="0 0 400 220" fill="none">
          <defs>
            <linearGradient id="out-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect x="60" y="60" width="280" height="100" rx="12" fill="url(#out-grad)" />
          <path d="M100 130 C120 100, 150 90, 180 110 C210 130, 240 100, 280 80" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="280" cy="80" r="5" fill="#f59e0b" />
          <text x="80" y="85" fill="#ffffff" fontSize="14" fontFamily="sans-serif" fontWeight="bold">LEARNING CURVE</text>
        </svg>
      );
    case 'forecasting':
      return (
        <div className="relative w-full h-full bg-slate-950 flex flex-col justify-center px-8 text-white">
          <div className="absolute inset-x-0 bottom-4 flex justify-between px-6 items-end h-[60%] opacity-35">
            <div className="w-4 bg-ai-cyan rounded-t-sm h-[30%]" />
            <div className="w-4 bg-ai-cyan rounded-t-sm h-[45%]" />
            <div className="w-4 bg-ai-cyan rounded-t-sm h-[60%]" />
            <div className="w-4 bg-ai-cyan rounded-t-sm h-[80%]" />
            <div className="w-4 bg-ai-violet rounded-t-sm h-[95%]" />
          </div>
          <div className="relative z-10 flex items-center justify-center h-12 w-12 rounded-full bg-primary/80 border border-white/20 mx-auto shadow-md">
            <PlayCircle className="h-8 w-8 text-ai-cyan" />
          </div>
          <p className="text-center mt-3 text-body-sm text-white/50 tracking-wider">BUDGET v2.0</p>
        </div>
      );
  }
};

export function ResourcesSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Filter categories helper
  const matchesCategory = (resource: Resource, category: string) => {
    if (category === 'All') return true;
    if (category === 'Case Studies' && resource.type === 'Case Study') return true;
    if (category === 'Whitepapers' && resource.type === 'Whitepaper') return true;
    if (category === 'Video Tutorials' && resource.type === 'Tutorial') return true;
    if (category === 'Documentation' && resource.type === 'Documentation') return true;
    if (category === 'Product Updates' && resource.type === 'Product Update') return true;
    return false;
  };

  const filteredResources = RESOURCES.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && matchesCategory(res, selectedCategory);
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section id="resources" className="section-cream relative px-4 py-20 md:px-8 md:py-24 border-t border-gray-300/10">
      <div className="relative z-10 mx-auto max-w-container">
        {/* Heading */}
        <RevealOnScroll className="mb-12 text-center">
          <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
            Empowering Educators with <span className="text-ai-electric">AI</span> <span className="text-gradient-ai">Intelligence</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-on-surface-variant">
            Explore our library of case studies, whitepapers, and technical guides to transform your
            school&apos;s operations and drive student success.
          </p>
        </RevealOnScroll>

        {/* Search Bar */}
        <RevealOnScroll className="mb-10 max-w-xl mx-auto">
          <div className="relative flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <Search className="absolute left-4 h-5 w-5 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Find resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-2 text-body-md text-on-surface bg-transparent outline-none placeholder:text-on-surface-variant/40"
            />
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'sm' }),
                'absolute right-1 py-1.5 px-5 rounded-full font-semibold shadow-sm'
              )}
            >
              Search
            </button>
          </div>
        </RevealOnScroll>

        {/* Filter Pills */}
        <RevealOnScroll className="mb-16 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-5 py-2 text-body-md font-semibold rounded-full transition-all duration-200 border',
                  isSelected
                    ? 'bg-secondary border-secondary text-white shadow-sm'
                    : 'bg-white border-gray-200 text-on-surface-variant hover:text-on-surface hover:border-gray-300'
                )}
              >
                {cat}
              </button>
            );
          })}
        </RevealOnScroll>

        {/* Featured Resource Banner (Displays when "All" is active or "Whitepapers" is active and search query is empty) */}
        {!searchQuery && (selectedCategory === 'All' || selectedCategory === 'Whitepapers') && (
          <RevealOnScroll className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-card">
              <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary mb-6">
                    Featured Whitepaper
                  </span>
                  <h3 className="text-headline-md md:text-headline-lg font-bold text-on-surface tracking-tight mb-4">
                    The 2026 State of AI in K-12 Administration
                  </h3>
                  <p className="text-body-lg text-on-surface-variant leading-relaxed mb-6">
                    An in-depth analysis of how over 500 school districts are leveraging automated
                    scheduling and predictive analytics to regain 15+ hours of administrative time
                    weekly.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                  <a
                    href="#download"
                    className={cn(
                      buttonVariants({ variant: 'primary', size: 'pill' }),
                      'px-6 py-2.5 font-semibold inline-flex items-center gap-2'
                    )}
                  >
                    Read Now
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <span className="text-body-md text-on-surface-variant/60 font-medium">
                    Oct 12, 2024
                  </span>
                </div>
              </div>
              <div className="md:col-span-5 relative min-h-[240px] md:min-h-full">
                {/* 3D abstract vector representation */}
                <div className="absolute inset-0 overflow-hidden bg-slate-950 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 300 240" fill="none">
                    <defs>
                      <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1b64f1" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <path d="M10 120 C80 60, 150 180, 290 120" stroke="url(#grid-grad)" strokeWidth="3" fill="none" />
                    <path d="M10 150 C100 80, 180 200, 290 90" stroke="url(#grid-grad)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                    <path d="M10 90 C70 140, 120 40, 290 160" stroke="url(#grid-grad)" strokeWidth="2" fill="none" />
                    <circle cx="150" cy="120" r="6" fill="#22d3ee" className="animate-pulse" />
                    <circle cx="100" cy="90" r="4" fill="#7c3aed" />
                    <circle cx="210" cy="140" r="5" fill="#1b64f1" />
                  </svg>
                  <div className="absolute bottom-4 left-4 rounded-xl bg-white/10 border border-white/20 p-2.5 backdrop-blur-md">
                    <Sparkles className="h-5 w-5 text-ai-cyan" />
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        )}

        {/* Resources Grid */}
        <RevealOnScroll className="mb-24">
          <h3 className="text-headline-md font-bold text-on-surface mb-8">
            Latest Resources
          </h3>
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredResources.map((res) => {
                  return (
                    <motion.article
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      key={res.id}
                      className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-card transition-all duration-300"
                    >
                      {/* Cover visual representation */}
                      <div className="h-48 overflow-hidden relative border-b border-gray-100">
                        <ResourceVisual type={res.visualType} />
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <span
                            className={cn(
                              'text-label-md font-bold uppercase tracking-wider mb-3 block',
                              res.type === 'Case Study' && 'text-sky-600',
                              res.type === 'Whitepaper' && 'text-purple-600',
                              res.type === 'Tutorial' && 'text-teal-600',
                              res.type === 'Documentation' && 'text-indigo-600',
                              res.type === 'Product Update' && 'text-amber-600'
                            )}
                          >
                            {res.type}
                          </span>
                          <h4 className="text-title-lg font-bold text-on-surface tracking-tight group-hover:text-secondary transition-colors mb-2">
                            {res.title}
                          </h4>
                          <p className="text-body-md text-on-surface-variant leading-relaxed mb-6">
                            {res.desc}
                          </p>
                        </div>

                        {/* Interactive Link */}
                        <a
                          href={res.linkHref}
                          className="inline-flex items-center gap-1.5 text-body-md font-bold text-secondary transition-colors group-hover:text-ai-electric"
                        >
                          {res.linkText}
                          {res.linkType === 'download' && <Download className="h-4 w-4" />}
                          {res.linkType === 'play' && <PlayCircle className="h-4 w-4" />}
                          {res.linkType === 'external' && <ExternalLink className="h-4 w-4" />}
                        </a>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <HelpCircle className="h-12 w-12 text-on-surface-variant/30 mx-auto mb-4" />
              <p className="text-body-lg font-semibold text-on-surface">No resources found</p>
              <p className="text-body-md text-on-surface-variant mt-1">
                Try searching for different terms or reset your filters.
              </p>
            </div>
          )}
        </RevealOnScroll>

        {/* Newsletter CTA Panel */}
        <RevealOnScroll>
          <div className="ai-glow-border rounded-2xl overflow-hidden p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-cinematic-navy relative">
            <div className="relative z-10 max-w-xl">
              <h3 className="text-headline-md md:text-headline-lg font-bold text-white tracking-tight mb-2">
                Stay Ahead of the Curve
              </h3>
              <p className="text-body-lg text-white/65 leading-relaxed">
                Join 2,500+ district leaders. Receive the latest AI trends and case studies directly
                in your inbox twice a month.
              </p>
            </div>

            <div className="relative z-10 w-full md:w-auto min-w-[320px]">
              {subscribed ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center text-emerald-400 font-semibold"
                >
                  Subscription successful! Welcome aboard.
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    placeholder="Enter school email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-body-md text-white placeholder:text-white/40 focus:border-ai-cyan focus:outline-none focus:ring-1 focus:ring-ai-cyan"
                  />
                  <button
                    type="submit"
                    className={cn(
                      buttonVariants({ variant: 'ai', size: 'pill' }),
                      'h-11 px-6 font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-md'
                    )}
                  >
                    Subscribe Now
                    <ArrowRightCircle className="h-4.5 w-4.5" />
                  </button>
                </form>
              )}
              <p className="text-center md:text-left mt-3 text-xs text-white/40">
                No spam. Only educational excellence.
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
