import { PrenotazioniSettingsClient } from './PrenotazioniSettingsClient';

export default function PrenotazioniSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Prenotazioni online</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          Decidi se attivare le prenotazioni, scegli i servizi prenotabili e chi può svolgerli.
        </p>
      </div>
      <PrenotazioniSettingsClient />
    </>
  );
}
