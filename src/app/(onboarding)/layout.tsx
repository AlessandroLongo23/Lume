import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { OnboardingHalo } from '@/lib/components/onboarding/OnboardingHalo';

/**
 * Full-screen layout for the onboarding bulk-import flow. Mirrors the welcome
 * splash aesthetic — single column, light typography, no admin chrome — so the
 * import wizard feels like a continuation of the post-registration moment.
 *
 * The lamplight halo sits behind every step. It's the brand backdrop: a soft
 * indigo radial gradient with a slow ambient pulse, scaled and tinted to
 * match the "Quiet Salon" north star without overpowering content.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <OnboardingHalo />
      <div className="absolute top-6 left-8">
        <LumeLogo size="md" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
