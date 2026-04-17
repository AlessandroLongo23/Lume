import { Building2 } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { NewSalonForm } from '@/lib/components/platform/NewSalonForm';

export default function NewSalonPage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <PageHeader
        title="Nuovo salone"
        subtitle="Crea manualmente un salone e il suo account proprietario"
        icon={Building2}
      />
      <NewSalonForm />
    </div>
  );
}
