'use client';

import { useEffect, useState, useMemo } from 'react';
import { useObiettiviStore } from '@/lib/stores/obiettivi';
import { BilancioObiettiviSkeleton } from '@/lib/components/admin/bilancio/BilancioSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/lib/components/shared/ui/Button';
import { formatCurrency } from '@/lib/utils/format';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';

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

  const labelClass = 'text-sm text-zinc-700 dark:text-zinc-300';

  const fields: { key: keyof Omit<ReturnType<typeof emptyForm>, 'buffer_percent'>; label: string }[] = [
    { key: 'casa', label: 'Casa (affitto / mutuo)' },
    { key: 'famiglia', label: 'Famiglia' },
    { key: 'spese_personali', label: 'Spese Personali' },
    { key: 'tempo_libero', label: 'Tempo Libero' },
    { key: 'trasporti', label: 'Trasporti' },
  ];

  if (isLoading) return <BilancioObiettiviSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
      {/* Left — form */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ring-0 border">
        <CardHeader className="px-6">
          <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Fabbisogno Personale Mensile
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Inserisci le tue spese mensili nette per calcolare l&apos;incasso necessario.
          </p>
        </CardHeader>
        <CardContent className="px-6 flex flex-col gap-4">
          {fields.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className={labelClass}>{label}</label>
              <CustomNumberInput
                value={form[key] as number | null}
                onChange={(v) => set(key, v)}
                min={0}
                step={1}
                placeholder="0"
                suffix="€"
              />
            </div>
          ))}

          {/* Buffer slider */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <span className={labelClass}>% Imprevisti</span>
              <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {form.buffer_percent}%
              </span>
            </div>
            <Slider
              min={0}
              max={50}
              step={1}
              value={[form.buffer_percent]}
              onValueChange={(values) => {
                const v = Array.isArray(values) ? values[0] : values;
                set('buffer_percent', v);
              }}
            />
            <p className="text-xs text-zinc-400">
              Margine di sicurezza aggiunto al fabbisogno netto.
            </p>
          </div>

          <div className="pt-2">
            <Button variant="primary" loading={isSaving} fullWidth onClick={handleSave}>
              {isSaving ? 'Salvataggio…' : 'Salva Obiettivi'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right — calculator */}
      <Card className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 ring-0 border lg:sticky lg:top-8 self-start">
        <CardHeader className="px-6">
          <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Target di Incasso
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
            Calcolato in base al fabbisogno inserito (forfettario 27%).
          </p>
        </CardHeader>
        <CardContent className="px-6 flex flex-col gap-0 divide-y divide-zinc-200 dark:divide-zinc-800">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Fabbisogno base</span>
            <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-200">{formatCurrency(sum)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Stipendio Netto Necessario</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">include {form.buffer_percent}% imprevisti</span>
            </div>
            <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-200">{formatCurrency(nettoMensile)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Tasse e INPS Stimate Annue (27%)</span>
            <span className="text-sm tabular-nums text-red-500 dark:text-red-400">+ {formatCurrency(tasseAnnue)}</span>
          </div>
          <div className="flex items-center justify-between py-4">
            <span className="text-base font-semibold text-zinc-900 dark:text-white">Incasso Lordo Target (Annuo)</span>
            <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">{formatCurrency(lordoAnnuo)}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Target Mensile</span>
            <span className="text-sm tabular-nums text-zinc-700 dark:text-zinc-200">{formatCurrency(lordoMensile)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
