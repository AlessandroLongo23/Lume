import { GraduationCap } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TutorialHub } from '@/lib/components/admin/tutorials/TutorialHub';

export default function AiutoPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Aiuto e tutorial"
        subtitle="Impara a usare Lume: guarda il video, leggi la guida o lasciati accompagnare passo passo."
        icon={GraduationCap}
      />
      <TutorialHub />
    </div>
  );
}
