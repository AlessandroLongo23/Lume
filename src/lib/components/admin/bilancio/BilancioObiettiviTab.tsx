'use client';

import { useEffect, useState, useMemo } from 'react';
import { useObiettiviStore } from '@/lib/stores/obiettivi';
import { BilancioObiettiviSkeleton } from '@/lib/components/admin/bilancio/BilancioSkeleton';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/lib/components/shared/ui/Button';
import { formatCurrency } from '@/lib/utils/format';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';

const emptyForm = () => ({
  casa: null as number | null,
  famiglia: null as number | null,
  spese_personali: null as number | null,
  tempo_libero: null as number | null,
  trasporti: null as number | null,
  buffer_percent: 10,
});

export function BilancioObiettiviTab() {
  const obiettivi = useObiettiviStore((s) => s.obiettivi);
  const isLoading = useObiettiviStore((s) => s.isLoading);
  const fetchObiettivi = useObiettiviStore((s) => s.fetchObiettivi);
  const saveObiettivi = useObiettiviStore((s) => s.saveObiettivi);

  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchObiettivi(); }, [fetchObiettivi]);

  // Populate form from fetched data
  useEffect(() => {
    if (obiettivi) {
      setForm({
        casa: obiettivi.casa > 0 ? obiettivi.casa : null,
        famiglia: obiettivi.famiglia > 0 ? obiettivi.famiglia : null,
        spese_personali: obiettivi.spese_personali > 0 ? obiettivi.spese_personali : null,
        tempo_libero: obiettivi.tempo_libero > 0 ? obiettivi.tempo_libero : null,
        trasporti: obiettivi.trasporti > 0 ? obiettivi.trasporti : null,
        buffer_percent: obiettivi.buffer_percent,
      });
    }
  }, [obiettivi]);

  const set = (key: string, value: number | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  const num = (v: number | null) => v ?? 0;

  const { sum, nettoMensile, lordoMensile, lordoAnnuo, tasseAnnue } = useMemo(() => {
    const s = num(form.casa) + num(form.famiglia) + num(form.spese_personali) + num(form.tempo_libero) + num(form.trasporti);
    const netto = s * (1 + form.buffer_percent / 100);
    const lordoM = netto / (1 - 0.27);
    const lordoA = lordoM * 12;
    return {
      sum: s,
      nettoMensile: netto,
      lordoMensile: lordoM,
      lordoAnnuo: lordoA,
      tasseAnnue: lordoA - netto * 12,
    };
  }, [form]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveObiettivi({
        casa: num(form.casa),
        famiglia: num(form.famiglia),
        spese_personali: num(form.spese_personali),
        tempo_libero: num(form.tempo_libero),
        trasporti: num(form.trasporti),
        buffer_percent: form.buffer_percent,
      });
      messagePopup.getState().success('Obiettivi salvati.');
    } catch {
      messagePopup.getState().error('Impossibile salvare gli obiettivi.');
    } finally {
      setIsSaving(false);
    }
  };

  const labelClass = 'text-sm text-[var(--lume-text)]';

  const fields: { key: keyof Omit<ReturnType<typeof emptyForm>, 'buffer_percent'>; label: string }[] = [
    { key: 'casa', label: 'Casa (affitto o mutuo)' },
    { key: 'famiglia', label: 'Famiglia' },
    { key: 'spese_personali', label: 'Spese personali' },
    { key: 'tempo_libero', label: 'Tempo libero' },
    { key: 'trasporti', label: 'Trasporti' },
  ];

  if (isLoading) return <BilancioObiettiviSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
      {/* Left: what you need each month */}
      <section className="surface-card p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-base font-medium tracking-tight text-[var(--lume-text)]">
            Fabbisogno personale mensile
          </h3>
          <p className="text-sm text-[var(--lume-text-secondary)] mt-1">
            Inserisci le tue spese mensili nette per calcolare l&apos;incasso necessario.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          {fields.map(({ key, label }) => (
            <Field key={key} label={label}>
              {({ id, describedBy, invalid }) => (
                <NumberInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={form[key] as number | null}
                  onChange={(v) => set(key, v)}
                  min={0}
                  step={1}
                  placeholder="0"
                  suffix="€"
                />
              )}
            </Field>
          ))}
        </div>

        {/* Buffer slider */}
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Margine per gli imprevisti</span>
            <span className="text-sm tabular-nums text-[var(--lume-text)]">
              {form.buffer_percent}%
            </span>
          </div>
          <Slider
            min={0}
            max={50}
            step={1}
            value={[form.buffer_percent]}
            aria-label="Margine per gli imprevisti"
            onValueChange={(values) => {
              const v = Array.isArray(values) ? values[0] : values;
              set('buffer_percent', v);
            }}
          />
          <p className="text-xs text-[var(--lume-text-muted)]">
            Margine di sicurezza aggiunto al fabbisogno netto.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" loading={isSaving} onClick={handleSave}>
            {isSaving ? 'Salvataggio…' : 'Salva obiettivi'}
          </Button>
        </div>
      </section>

      {/* Right: the revenue that covers it */}
      <section className="surface-card p-6 lg:sticky lg:top-8">
        <h3 className="text-base font-medium tracking-tight text-[var(--lume-text)]">
          Incasso da raggiungere
        </h3>
        <p className="text-sm text-[var(--lume-text-secondary)] mt-1">
          Calcolato in base al fabbisogno inserito (forfettario 27%).
        </p>

        <div className="mt-6">
          <p className="tabular-nums text-3xl leading-tight font-normal tracking-tight text-[var(--lume-text)]">
            {formatCurrency(lordoAnnuo)}
          </p>
          <p className="mt-1.5 text-sm text-[var(--lume-text-secondary)]">Incasso lordo all&apos;anno</p>
        </div>

        <dl className="mt-6 flex flex-col divide-y divide-line border-y border-line text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[var(--lume-text-secondary)]">Al mese</dt>
            <dd className="tabular-nums text-[var(--lume-text)]">{formatCurrency(lordoMensile)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[var(--lume-text-secondary)]">Fabbisogno base</dt>
            <dd className="tabular-nums text-[var(--lume-text)]">{formatCurrency(sum)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="flex flex-col">
              <span className="text-[var(--lume-text-secondary)]">Stipendio netto necessario</span>
              <span className="text-xs text-[var(--lume-text-muted)]">include {form.buffer_percent}% di imprevisti</span>
            </dt>
            <dd className="tabular-nums text-[var(--lume-text)]">{formatCurrency(nettoMensile)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[var(--lume-text-secondary)]">Tasse e INPS stimate all&apos;anno (27%)</dt>
            <dd className="tabular-nums text-[var(--lume-text)]">+ {formatCurrency(tasseAnnue)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
