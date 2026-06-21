'use client';

import Link from 'next/link';
import { cn, CinematicCard, RevealOnScroll } from '@eduai365/ui';
import { buildLoginUrl, ROLE_CARDS } from '@/lib/roles';

const ROLE_TONES = [
  'bento-card-pink',
  'bento-card-sky',
  'bento-card-yellow',
  'bento-card-teal',
  'bento-card-violet',
  'bento-card-khaki',
  'bento-card-cream',
  'bento-card-sky',
] as const;

interface RoleCardsGridProps {
  schoolSlug: string;
}

export function RoleCardsGrid({ schoolSlug }: RoleCardsGridProps) {
  return (
    <section id="roles" className="section-white relative px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mb-12 text-center">
          <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
            Built for every role on campus
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-body-lg text-on-surface-variant">
            Personalized portals designed to bring students, faculty, and staff together — without
            the usual friction.
          </p>
        </RevealOnScroll>

        <div className="grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ROLE_CARDS.map((card, index) => {
            const Icon = card.icon;
            const href = buildLoginUrl(card.role, schoolSlug);
            const isPurple = card.variant === 'purple';
            const tone = ROLE_TONES[index % ROLE_TONES.length] ?? 'bento-card-sky';

            return (
              <RevealOnScroll key={card.title} delay={index * 0.04}>
                <Link href={href} className="block h-full">
                  <CinematicCard
                    variant="solid"
                    glow={isPurple}
                    tilt
                    className={cn(
                      'group flex h-full min-h-[170px] flex-col rounded-xl p-4 transition-all duration-300',
                      isPurple ? 'bento-card-violet ring-2 ring-ai-violet/25' : tone,
                    )}
                  >
                    <div>
                      <div className="icon-gh-box mb-3 h-8 w-8">
                        <Icon className="h-4.5 w-4.5 text-ai-violet" strokeWidth={1.5} aria-hidden />
                      </div>
                      <h3 className="text-body-md font-bold text-on-surface">{card.title}</h3>
                      <p className="mt-1 text-body-sm leading-normal text-on-surface-variant/80">
                        {card.description}
                      </p>
                    </div>
                  </CinematicCard>
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
