import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileDock } from './MobileDock';
import { Onboarding } from '@/components/onboarding/Onboarding';
import { OnboardingTrigger } from '@/components/onboarding/OnboardingTrigger';
import { MissionsTracker } from '@/components/onboarding/MissionsTracker';
import { FloatingAIButton } from '@/components/ai/FloatingAIButton';
import { XpToaster } from '@/components/gamification/XpToaster';
import { SearchOverlay } from '@/components/search/SearchOverlay';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      <Sidebar />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 pb-28 lg:pb-10">
        <Topbar />
        {children}
      </main>
      <MobileDock />
      <OnboardingTrigger />
      <Onboarding />
      <FloatingAIButton />
      <XpToaster />
      <SearchOverlay />
      <MissionsTracker />
    </div>
  );
}
