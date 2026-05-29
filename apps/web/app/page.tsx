import { Intro } from '@/components/landing/Intro';
import { Hero } from '@/components/landing/Hero';
import { ScrollProgress } from '@/components/effects/ScrollProgress';
import { Particles } from '@/components/effects/Particles';
import { CompaniesTicker } from '@/components/landing/CompaniesTicker';
import { TrendingJobs } from '@/components/landing/TrendingJobs';
import { AISection } from '@/components/landing/AISection';
import { CVShowcase } from '@/components/landing/CVShowcase';
import { CommunitiesSection } from '@/components/landing/Communities';
import { Testimonials } from '@/components/landing/Testimonials';
import { Universities } from '@/components/landing/Universities';
import { Footer } from '@/components/landing/Footer';
import { TopNav } from '@/components/layout/TopNav';

export default function HomePage() {
  return (
    <>
      <Intro />
      <ScrollProgress />
      <TopNav />
      <main className="relative overflow-x-hidden">
        <Particles className="fixed inset-0 -z-10" density={26} />
        <Hero />
        <CompaniesTicker />
        <TrendingJobs />
        <AISection />
        <CVShowcase />
        <CommunitiesSection />
        <Testimonials />
        <Universities />
        <Footer />
      </main>
    </>
  );
}
