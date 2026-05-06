'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Plus, X, Check, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { ComuneAutocomplete, type ComuneSelection } from '@/lib/components/shared/ui/ComuneAutocomplete';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProspectsStore, type ProspectInput } from '@/lib/stores/prospects';
import { Prospect, PROSPECT_STATUSES, STATUS_LABEL, STATUS_TONE, type ProspectStatus } from '@/lib/types/Prospect';
import { ProspectStatusChip } from './ProspectStatusChip';
import { cn } from '@/lib/utils';

const GMAPS_RE = /^https?:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|maps\.google\.com)/;

interface ProspectFormModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  prospect?: Prospect | null;
  onDeleteRequest?: (p: Prospect) => void;
}

type FormState = {
  name:             string;
  phone_shop:       string;
  google_maps_url:  string;
  address:          string;
  owner_name:       string;
  phone_personal:   string;
  current_software: string;
  notes:            string;
};

const emptyForm = (): FormState => ({
  name: '', phone_shop: '', google_maps_url: '', address: '',
  owner_name: '', phone_personal: '', current_software: '', notes: '',
});

const formFromProspect = (p: Prospect): FormState => ({
  name:             p.name,
  phone_shop:       p.phone_shop ?? '',
  google_maps_url:  p.google_maps_url ?? '',
  address:          p.address ?? '',
  owner_name:       p.owner_name ?? '',
  phone_personal:   p.phone_personal ?? '',
  current_software: p.current_software ?? '',
  notes:            p.notes ?? '',
});

const comuneFromProspect = (p: Prospect): ComuneSelection | null => {
  if (!p.comune_code || !p.city) return null;
  return {
    comune_code: p.comune_code,
    city:        p.city,
    province:    p.province ?? '',
    region:      p.region ?? '',
  };
};

const TONE_DOT: Record<(typeof STATUS_TONE)[ProspectStatus], string> = {
  neutral: 'bg-muted-foreground',
  muted:   'bg-muted-foreground/60',
  warning: 'bg-[var(--lume-warning-fg)]',
  danger:  'bg-[var(--lume-danger-fg)]',
  success: 'bg-[var(--lume-success-fg)]',
  accent:  'bg-[var(--lume-accent)]',
};

export function ProspectFormModal({ isOpen, onClose, prospect, onDeleteRequest }: ProspectFormModalProps) {
  const add    = useProspectsStore((s) => s.add);
  const update = useProspectsStore((s) => s.update);
  const isEdit = !!prospect;

  const [form, setForm]       = useState<FormState>(emptyForm());
  const [comune, setComune]   = useState<ComuneSelection | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'pre_call' | 'post_call'>('post_call');
  const prefillDoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (prospect) {
        setForm(formFromProspect(prospect));
        setComune(comuneFromProspect(prospect));
      } else {
        setForm(emptyForm());
        setComune(null);
      }
      setErrors({});
      setSubmitting(false);
      setPrefilling(false);
      setPrefillDone(false);
      setActiveTab('post_call');
    }
  }, [isOpen, prospect]);

  const triggerPrefill = async (url: string) => {
    if (prefilling) return;
    if (prefillDoneTimer.current) clearTimeout(prefillDoneTimer.current);
    setPrefilling(true);
    setPrefillDone(false);
    try {
      const res = await fetch('/api/platform/prospects/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setForm((s) => ({
        ...s,
        name:     data.name     ?? s.name,
        phone_shop: data.phone_shop ?? s.phone_shop,
        address:  data.address  ?? s.address,
      }));
      if (data.comune_code && data.city) {
        setComune({
          comune_code: data.comune_code,
          city:        data.city,
          province:    data.province ?? '',
          region:      data.region   ?? '',
        });
      }
      setPrefillDone(true);
      prefillDoneTimer.current = setTimeout(() => setPrefillDone(false), 4000);
    } finally {
      setPrefilling(false);
    }
  };

  const handleMapsUrlChange = (url: string) => {
    setForm((s) => ({ ...s, google_maps_url: url }));
    setPrefillDone(false);
    if (GMAPS_RE.test(url.trim())) {
      triggerPrefill(url.trim());
    }
  };

  const handleStatusChange = async (status: ProspectStatus) => {
    if (!prospect || prospect.status === status) return;
    try {
      await update(prospect.id, { status });
      messagePopup.getState().success('Stato aggiornato');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore: ' + msg);
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Inserisci il nome del salone';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    const payload: ProspectInput = {
      name:             form.name.trim(),
      phone_shop:       form.phone_shop.trim()       || null,
      google_maps_url:  form.google_maps_url.trim()  || null,
      address:          form.address.trim()          || null,
      owner_name:       form.owner_name.trim()       || null,
      phone_personal:   form.phone_personal.trim()   || null,
      current_software: form.current_software.trim() || null,
      notes:            form.notes.trim()            || null,
      comune_code:      comune?.comune_code ?? null,
      city:             comune?.city ?? null,
      province:         comune?.province ?? null,
      region:           comune?.region ?? null,
    };

    try {
      if (isEdit && prospect) {
        await update(prospect.id, payload);
        messagePopup.getState().success('Prospect aggiornato');
      } else {
        await add(payload);
        messagePopup.getState().success('Prospect aggiunto');
      }
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore: ' + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = isEdit ? Pencil : Plus;

  return (
    <Modal isOpen={isOpen} onClose={onClose} classes="max-w-2xl">
      <div className="flex flex-col bg-muted rounded-lg shadow-xl w-full h-full max-h-[92vh]">
        <div className="flex flex-row items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex flex-row items-center gap-3 truncate">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <div className="flex flex-col truncate">
              <h2 className="text-lg font-semibold text-foreground">
                {isEdit ? prospect.name : 'Nuovo prospect'}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {isEdit ? 'Modifica i dettagli o aggiorna lo stato' : 'Aggiungi un salone alla lista da chiamare'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="md" iconOnly aria-label="Chiudi" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-y-auto space-y-6">
          {isEdit && prospect && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-foreground">Stato</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Chiamate: <span className="tabular-nums font-medium text-foreground">{prospect.call_count}</span></span>
                  {prospect.last_call_at && (
                    <span>Ultima: <span className="tabular-nums font-medium text-foreground">{new Date(prospect.last_call_at).toLocaleDateString('it-IT')}</span></span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PROSPECT_STATUSES.map((s) => {
                  const active = prospect.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-[var(--lume-accent)] bg-[var(--lume-accent-light)] text-[var(--lume-accent-dark)]'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', TONE_DOT[STATUS_TONE[s]])} />
                      {STATUS_LABEL[s]}
                    </button>
                  );
                })}
              </div>
              {prospect.status === 'callback_scheduled' && (
                <div className="text-xs text-muted-foreground">
                  Per impostare/aggiornare la data di richiamo, usa la sessione di chiamata.
                </div>
              )}
              {prospect.callback_at && (
                <div className="text-xs text-muted-foreground">
                  Da richiamare il <span className="font-medium text-foreground tabular-nums">
                    {new Date(prospect.callback_at).toLocaleString('it-IT')}
                  </span>
                </div>
              )}
            </section>
          )}

          {isEdit && <div className="border-t border-border" />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Maps URL at top — paste to auto-fill everything */}
            <div className="md:col-span-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  Link Google Maps
                  {prefilling && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                      <Loader2 className="size-3 animate-spin" />
                      Ricerca in corso…
                    </span>
                  )}
                  {prefillDone && !prefilling && (
                    <span className="flex items-center gap-1 text-xs text-[var(--lume-success-fg)] font-normal">
                      <CheckCircle2 className="size-3" />
                      Compilato automaticamente
                    </span>
                  )}
                </label>
                <FormInput
                  value={form.google_maps_url}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  placeholder="Incolla il link di Google Maps per compilare i campi in automatico…"
                  type="url"
                  autoFocus={!isEdit}
                  disabled={prefilling}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <FormInput
                label="Nome salone"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                error={errors.name}
                required
                placeholder="Parrucchiere Rossi"
                autoFocus={isEdit}
              />
            </div>

            <FormInput
              label="Telefono salone"
              value={form.phone_shop}
              onChange={(e) => setForm((s) => ({ ...s, phone_shop: e.target.value }))}
              placeholder="+39 02 1234567"
              inputMode="tel"
            />

            <FormInput
              label="Telefono titolare"
              value={form.phone_personal}
              onChange={(e) => setForm((s) => ({ ...s, phone_personal: e.target.value }))}
              placeholder="+39 333 1234567"
              inputMode="tel"
            />

            <div className="md:col-span-2">
              <ComuneAutocomplete
                label="Comune"
                value={comune}
                onChange={setComune}
              />
            </div>

            <FormInput
              label="Titolare"
              value={form.owner_name}
              onChange={(e) => setForm((s) => ({ ...s, owner_name: e.target.value }))}
              placeholder="Mario Rossi"
            />

            <FormInput
              label="Software in uso"
              value={form.current_software}
              onChange={(e) => setForm((s) => ({ ...s, current_software: e.target.value }))}
              placeholder="Treatwell, agenda cartacea, …"
            />

            <div className="md:col-span-2">
              <FormInput
                label="Indirizzo"
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                placeholder="Via Roma 12, Milano"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-foreground">Note</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Qualunque dettaglio utile prima della chiamata…"
                rows={3}
                className="w-full rounded-md border bg-card text-foreground placeholder:text-muted-foreground border-input focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none px-3 py-2 text-sm transition-[border-color,box-shadow] duration-200"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-row flex-wrap items-center justify-between gap-3 p-6 border-t border-border shrink-0">
          <div>
            {isEdit && prospect && onDeleteRequest && (
              <Button
                variant="ghost"
                leadingIcon={Trash2}
                onClick={() => { onDeleteRequest(prospect); }}
                className="text-[var(--lume-danger-fg)] hover:bg-[var(--lume-danger-bg)]"
              >
                Elimina
              </Button>
            )}
          </div>
          <div className="flex flex-row flex-wrap items-center gap-3">
            <ProspectStatusChip status={prospect?.status ?? 'not_contacted'} className={isEdit ? 'mr-2' : 'hidden'} />
            <Button variant="secondary" leadingIcon={X} onClick={onClose}>
              Annulla
            </Button>
            <Button
              variant="primary"
              leadingIcon={Check}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {isEdit ? 'Salva' : 'Aggiungi'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
