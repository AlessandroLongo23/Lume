'use client';

import { useEffect, useState } from 'react';
import { Receipt, Save, Loader2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { RegimeFiscale, SalonFiscal } from '@/lib/types/Salon';

interface FormState {
  ragione_sociale: string;
  p_iva: string;
  codice_fiscale: string;
  regime: RegimeFiscale | '';
  sdi: string;
  pec: string;
  default_iva_pct: number | '';
}

const IVA_OPTIONS: number[] = [22, 10, 5, 4, 0];

function fromFiscal(f: SalonFiscal): FormState {
  return {
    ragione_sociale: f.ragione_sociale ?? '',
    p_iva: f.p_iva ?? '',
    codice_fiscale: f.codice_fiscale ?? '',
    regime: (f.regime ?? '') as FormState['regime'],
    sdi: f.sdi ?? '',
    pec: f.pec ?? '',
    default_iva_pct: f.default_iva_pct ?? '',
  };
}

export function FatturazionePanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const isLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [form, setForm] = useState<FormState>(() => fromFiscal(settings?.fiscal ?? {}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) setForm(fromFiscal(settings?.fiscal ?? {}));
  }, [isLoaded, settings?.fiscal]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const piva = form.p_iva.trim();
    if (piva && !/^\d{11}$/.test(piva)) {
      setError('La P.IVA deve essere di 11 cifre');
      return;
    }
    const cf = form.codice_fiscale.trim();
    if (cf && !/^([A-Z0-9]{11}|[A-Z0-9]{16})$/i.test(cf)) {
      setError('Codice Fiscale non valido (11 o 16 caratteri)');
      return;
    }
    const sdi = form.sdi.trim();
    if (sdi && !/^[A-Z0-9]{7}$/i.test(sdi)) {
      setError('Codice SDI non valido (7 caratteri)');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        fiscal: {
          ragione_sociale: form.ragione_sociale.trim() || undefined,
          p_iva: piva || undefined,
          codice_fiscale: cf ? cf.toUpperCase() : undefined,
          regime: form.regime || undefined,
          sdi: sdi ? sdi.toUpperCase() : undefined,
          pec: form.pec.trim() || undefined,
          default_iva_pct: typeof form.default_iva_pct === 'number' ? form.default_iva_pct : undefined,
        },
      });
      messagePopup.getState().success('Dati fiscali salvati');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <SettingsCard
        icon={Receipt}
        title="Dati fiscali"
        description="Necessari per ricevute, fatture e adempimenti."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="ragione-sociale" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Ragione sociale
            </label>
            <input
              id="ragione-sociale"
              type="text"
              maxLength={120}
              value={form.ragione_sociale}
              onChange={(e) => setField('ragione_sociale', e.target.value)}
              placeholder="Mario Rossi Srl"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="p-iva" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Partita IVA
            </label>
            <input
              id="p-iva"
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={form.p_iva}
              onChange={(e) => setField('p_iva', e.target.value.replace(/\D/g, ''))}
              placeholder="01234567890"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="cf" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Codice Fiscale
            </label>
            <input
              id="cf"
              type="text"
              maxLength={16}
              value={form.codice_fiscale}
              onChange={(e) => setField('codice_fiscale', e.target.value.toUpperCase())}
              placeholder="RSSMRA80A01H501Z"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono uppercase text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="regime" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Regime fiscale
            </label>
            <select
              id="regime"
              value={form.regime}
              onChange={(e) => setField('regime', e.target.value as FormState['regime'])}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            >
              <option value="">— Seleziona —</option>
              <option value="forfettario">Forfettario</option>
              <option value="ordinario">Ordinario</option>
            </select>
          </div>

          <div>
            <label htmlFor="default-iva" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              IVA predefinita
            </label>
            <select
              id="default-iva"
              value={form.default_iva_pct === '' ? '' : String(form.default_iva_pct)}
              onChange={(e) => setField('default_iva_pct', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            >
              <option value="">— Nessuna —</option>
              {IVA_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}%</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sdi" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Codice SDI
            </label>
            <input
              id="sdi"
              type="text"
              maxLength={7}
              value={form.sdi}
              onChange={(e) => setField('sdi', e.target.value.toUpperCase())}
              placeholder="0000000"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono uppercase text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="pec" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              PEC
            </label>
            <input
              id="pec"
              type="email"
              maxLength={200}
              value={form.pec}
              onChange={(e) => setField('pec', e.target.value)}
              placeholder="salone@pec.it"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        <p className="mt-3 text-xs text-zinc-500">
          {"Compila Codice SDI o PEC per la fatturazione elettronica. Tieni almeno uno dei due."}
        </p>
      </SettingsCard>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" leadingIcon={Save} loading={saving}>
          {saving ? 'Salvataggio…' : 'Salva'}
        </Button>
      </div>
    </form>
  );
}
