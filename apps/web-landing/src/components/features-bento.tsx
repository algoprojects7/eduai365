'use client';

import { useState, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GraduationCap,
  UserCog,
  CalendarClock,
  Bus,
  Footprints,
  ClipboardCheck,
  FileBarChart,
  Landmark,
  UserCheck,
  Wallet,
  CalendarOff,
  DoorOpen,
  BookOpen,
  NotebookPen,
  HeartPulse,
  Trophy,
  Shirt,
  Building2,
  Package,
  UsersRound,
  Brain,
  Sparkles,
  FileText,
  MessageSquare,
  Bell,
  Cake,
  type LucideIcon,
} from 'lucide-react';
import { cn, RevealOnScroll } from '@eduai365/ui';

/* ────────────────────────────────────────────────── */
/*  Feature Data                                      */
/* ────────────────────────────────────────────────── */

type Category =
  | 'all'
  | 'academics'
  | 'operations'
  | 'safety'
  | 'finance'
  | 'studentLife'
  | 'ai';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  category: Category[];
  glowColor: string;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'All Modules' },
  { key: 'academics', label: 'Core Academics' },
  { key: 'operations', label: 'Campus Ops' },
  { key: 'safety', label: 'Safety & Tracking' },
  { key: 'finance', label: 'Finance & HR' },
  { key: 'studentLife', label: 'Student Life' },
  { key: 'ai', label: 'AI & Alumni' },
];

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: 'Students',
    desc: 'Complete student lifecycle — enrollment, profiles, attendance, and academic records in one place.',
    category: ['academics'],
    glowColor: 'rgba(27, 100, 241, 0.2)',
  },
  {
    icon: GraduationCap,
    title: 'Teachers',
    desc: 'Faculty management with timetables, course assignments, performance reviews, and communication tools.',
    category: ['academics'],
    glowColor: 'rgba(124, 58, 237, 0.2)',
  },
  {
    icon: UserCog,
    title: 'Staff',
    desc: 'Administrative and support staff management — roles, duties, shifts, and department coordination.',
    category: ['academics'],
    glowColor: 'rgba(34, 211, 238, 0.2)',
  },
  {
    icon: CalendarClock,
    title: 'Class Timetable',
    desc: 'AI-powered timetable generation with conflict-free scheduling for rooms, faculty, and sections.',
    category: ['academics'],
    glowColor: 'rgba(27, 100, 241, 0.2)',
  },
  {
    icon: ClipboardCheck,
    title: 'Examination',
    desc: 'End-to-end exam management — hall tickets, seating plans, invigilation, grading, and results.',
    category: ['academics'],
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    icon: FileBarChart,
    title: 'Report Card',
    desc: 'Auto-generated report cards with configurable grading systems, remarks, and parent access.',
    category: ['academics'],
    glowColor: 'rgba(16, 185, 129, 0.2)',
  },
  {
    icon: NotebookPen,
    title: 'Assignment',
    desc: 'Digital assignment creation, submission tracking, plagiarism detection, and grading workflows.',
    category: ['academics'],
    glowColor: 'rgba(124, 58, 237, 0.2)',
  },
  {
    icon: BookOpen,
    title: 'Library',
    desc: 'Smart library management — catalog search, issue/return tracking, overdue alerts, and e-resources.',
    category: ['academics'],
    glowColor: 'rgba(27, 100, 241, 0.2)',
  },
  {
    icon: DoorOpen,
    title: 'Admission',
    desc: 'Streamlined admissions — online applications, merit lists, document verification, and enrollment.',
    category: ['operations'],
    glowColor: 'rgba(34, 211, 238, 0.2)',
  },
  {
    icon: Shirt,
    title: 'Uniform',
    desc: 'Uniform inventory management, size tracking, ordering, and distribution across campuses.',
    category: ['operations'],
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    icon: Building2,
    title: 'Hostel',
    desc: 'Room allocation, mess management, attendance, visitor logs, and warden dashboards.',
    category: ['operations'],
    glowColor: 'rgba(124, 58, 237, 0.2)',
  },
  {
    icon: Package,
    title: 'Assets',
    desc: 'Track institutional assets — procurement, allocation, maintenance schedules, and depreciation.',
    category: ['operations'],
    glowColor: 'rgba(27, 100, 241, 0.2)',
  },
  {
    icon: Bus,
    title: 'Live GPS Tracking',
    desc: 'Real-time GPS tracking of transport fleet with route optimization and parent notifications.',
    category: ['safety'],
    glowColor: 'rgba(239, 68, 68, 0.2)',
  },
  {
    icon: Footprints,
    title: 'GPS Chip Tracking',
    desc: 'Student safety tracking via GPS-enabled shoe chips — geofencing, zone alerts, and parent dashboard.',
    category: ['safety'],
    glowColor: 'rgba(239, 68, 68, 0.2)',
  },
  {
    icon: Landmark,
    title: 'Finance',
    desc: 'Comprehensive finance — fee management, receipts, budgeting, expense tracking, and audit trails.',
    category: ['finance'],
    glowColor: 'rgba(16, 185, 129, 0.2)',
  },
  {
    icon: UserCheck,
    title: 'HR',
    desc: 'Human resource management — recruitment, onboarding, appraisals, and employee lifecycle tracking.',
    category: ['finance'],
    glowColor: 'rgba(27, 100, 241, 0.2)',
  },
  {
    icon: Wallet,
    title: 'Payroll',
    desc: 'Automated payroll processing with tax computations, salary slips, and compliance reports.',
    category: ['finance'],
    glowColor: 'rgba(124, 58, 237, 0.2)',
  },
  {
    icon: CalendarOff,
    title: 'Leave',
    desc: 'Leave management for staff and faculty — applications, approvals, balance tracking, and policies.',
    category: ['finance'],
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    icon: HeartPulse,
    title: 'Health',
    desc: 'Student health records, infirmary visits, vaccination tracking, and emergency contact management.',
    category: ['studentLife'],
    glowColor: 'rgba(239, 68, 68, 0.2)',
  },
  {
    icon: Trophy,
    title: 'Clubs',
    desc: 'Extra-curricular club management — registrations, events, achievements, and activity calendars.',
    category: ['studentLife'],
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    icon: MessageSquare,
    title: 'Communication',
    desc: 'Integrated messaging — announcements, parent-teacher chat, SMS/email broadcasts, and group channels.',
    category: ['operations'],
    glowColor: 'rgba(27, 100, 241, 0.2)',
  },
  {
    icon: Bell,
    title: 'Notification',
    desc: 'Smart notification engine — push alerts, event reminders, fee due alerts, and personalized digests.',
    category: ['operations'],
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    icon: Cake,
    title: 'Birthday Wish',
    desc: 'Automated birthday greetings for staff, and teachers with personalized e-cards and announcements.',
    category: ['studentLife'],
    glowColor: 'rgba(239, 68, 68, 0.2)',
  },
  {
    icon: UsersRound,
    title: 'Alumni',
    desc: 'Alumni network — directory, event invitations, mentorship programs, and donation tracking.',
    category: ['ai'],
    glowColor: 'rgba(34, 211, 238, 0.2)',
  },
  {
    icon: FileText,
    title: 'AI Generated Lesson Plan',
    desc: 'Auto-generate curriculum-aligned lesson plans with learning objectives, activities, and assessments using AI.',
    category: ['ai'],
    glowColor: 'rgba(16, 185, 129, 0.2)',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    desc: 'Predictive analytics, anomaly detection, performance forecasting, and intelligent recommendations.',
    category: ['ai'],
    glowColor: 'rgba(124, 58, 237, 0.25)',
  },
];

/* ────────────────────────────────────────────────── */
/*  3D Tilt Card                                      */
/* ────────────────────────────────────────────────── */

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  };

  const Icon = feature.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{
        duration: 0.35,
        delay: index * 0.03,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="feature-card-3d"
    >
      <div
        ref={cardRef}
        className="feature-card-3d-inner feature-card-shimmer group h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="feature-icon-glow mb-4"
          style={{ '--icon-glow-color': feature.glowColor } as React.CSSProperties}
        >
          <Icon className="h-5 w-5 text-ai-violet" strokeWidth={1.5} aria-hidden />
        </div>
        <h3 className="text-title-lg font-semibold text-on-surface">{feature.title}</h3>
        <p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────── */
/*  Main Section                                      */
/* ────────────────────────────────────────────────── */

export function FeaturesBento() {
  const [activeTab, setActiveTab] = useState<Category>('all');

  const filtered =
    activeTab === 'all'
      ? FEATURES
      : FEATURES.filter((f) => f.category.includes(activeTab));

  return (
    <section id="features" className="section-white relative px-4 py-20 md:px-8 md:py-28 overflow-hidden">
      {/* Decorative background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(27,100,241,0.12) 0%, rgba(124,58,237,0.08) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-container">
        {/* Header */}
        <RevealOnScroll className="mx-auto mb-14 max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-ai-violet/15 px-3.5 py-1 text-xs font-semibold text-ai-violet uppercase tracking-wider mb-4">
            <Sparkles className="h-3 w-3" />
            Platform Modules
          </div>
          <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
            Explore the{' '}
            <span className="text-gradient-ai">Higher Education OS</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-on-surface-variant">
            26 purpose-built modules that cover every facet of campus
            administration — from AI-powered insights to GPS-enabled student
            safety.
          </p>
        </RevealOnScroll>

        {/* Category Tabs */}
        <RevealOnScroll className="mb-12">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveTab(cat.key)}
                className={cn(
                  'feature-tab',
                  activeTab === cat.key && 'feature-tab-active',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom stat */}
        <RevealOnScroll className="mt-16 text-center">
          <p className="text-body-lg text-on-surface-variant">
            <span className="text-gradient-ai font-bold text-headline-md">26+</span>{' '}
            modules.{' '}
            <span className="text-gradient-ai font-bold text-headline-md">1</span>{' '}
            unified platform.{' '}
            <span className="font-semibold text-on-surface">Zero friction.</span>
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
