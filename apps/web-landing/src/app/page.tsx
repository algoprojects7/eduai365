import { CtaSection } from '@/components/cta-section';
import { SalesInfo } from '@/components/sales-info';
import { FranchiseInfo } from '@/components/franchise-info';
import { FeaturesBento } from '@/components/features-bento';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { LandingFooter } from '@/components/landing-footer';
import { ModuleMarquee } from '@/components/module-marquee';
import { RoleCardsGrid } from '@/components/role-cards-grid';
import { PricingSection } from '@/components/pricing-section';
// import { ResourcesSection } from '@/components/resources-section';
import { SnowParticles } from '@/components/snow-particles';
import { TrustedInstitutions } from '@/components/trusted-institutions';
import { WhatsAppChat } from '@/components/whatsapp-chat';
import { WhySchoolsChoose } from '@/components/why-schools-choose';
import { AiCapabilities } from '@/components/ai-capabilities';
import { CompetitiveEdge } from '@/components/competitive-edge';
import { DEFAULT_SCHOOL_SLUG, fetchSchools } from '@/lib/schools';

export default async function HomePage() {
  const schools = await fetchSchools();
  const defaultSchoolSlug = schools[0]?.slug ?? DEFAULT_SCHOOL_SLUG;

  return (
    <div className="relative">
      <SnowParticles />
      <Header />
      <main className="bg-surface">
        <Hero />
        <WhySchoolsChoose />
        <ModuleMarquee />
        <FeaturesBento />
        <AiCapabilities />
        <TrustedInstitutions schools={schools} />
        <CompetitiveEdge />
        <RoleCardsGrid schoolSlug={defaultSchoolSlug} />
        <PricingSection />
        {/* <ResourcesSection /> */}
        <CtaSection />
        <SalesInfo />
        <FranchiseInfo />
      </main>
      <LandingFooter />
      <WhatsAppChat />
    </div>
  );
}
