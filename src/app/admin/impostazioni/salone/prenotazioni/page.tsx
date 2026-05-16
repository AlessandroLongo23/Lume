import { PrenotazioniPanel } from '@/lib/components/admin/settings/PrenotazioniPanel';
import { BookableServicesPanel } from '@/lib/components/admin/settings/BookableServicesPanel';
import { OperatorServicesMatrix } from '@/lib/components/admin/settings/OperatorServicesMatrix';

export default function PrenotazioniSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Prenotazioni online</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Decidi se attivare le prenotazioni, scegli i servizi prenotabili e chi può svolgerli.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <PrenotazioniPanel />
        <BookableServicesPanel />
        <OperatorServicesMatrix />
      </div>
    </>
  );
}
