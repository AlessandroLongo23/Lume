'use client';

import { useState, useEffect, useId, useRef } from 'react';
import { Check, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

const GMAPS_RE = /^https?:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|maps\.google\.com)/;
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { DialogFooter, DialogHeader } from '@/lib/components/shared/ui/modals/dialogParts';
import { ComuneAutocomplete, type ComuneSelection } from '@/lib/components/shared/ui/ComuneAutocomplete';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProspectsStore, type ProspectInput } from '@/lib/stores/prospects';
import { Prospect, PROSPECT_STATUSES, type ProspectStatus } from '@/lib/types/Prospect';
import { ProspectStatusChip } from './ProspectStatusChip';
import { TabBar, TabButton } from '@/lib/components/shared/ui/Tabs';

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

export function ProspectFormModal({ isOpen, onClose, prospect, onDeleteRequest }: ProspectFormModalProps) {
  const add       = useProspectsStore((s) => s.add);
  const update    = useProspectsStore((s) => s.update);
  const prospects = useProspectsStore((s) => s.prospects);
  const isEdit = !!prospect;
  const titleId = useId();

  const [form, setForm]       = useState<FormState>(emptyForm());
  const [comune, setComune]   = useState<ComuneSelection | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [duplicateProspect, setDuplicateProspect] = useState<Prospect | null>(null);
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
      setPrefillError(null);
      setDuplicateProspect(null);
      setActiveTab('post_call');
    }
  }, [isOpen, prospect]);

  const triggerPrefill = async (url: string) => {
    if (prefilling) return;
    if (prefillDoneTimer.current) clearTimeout(prefillDoneTimer.current);
    setPrefilling(true);
    setPrefillDone(false);
    setPrefillError(null);
    try {
      const res = await fetch('/api/platform/prospects/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPrefillError(data.error ?? 'Errore durante il prefill');
        return;
      }
      setForm((s) => ({
        ...s,
        name:       data.name      ?? s.name,
        phone_shop: data.phone_shop ?? s.phone_shop,
        address:    data.address   ?? s.address,
      }));
      if (data.comune_code && data.city) {
        setComune({ comune_code: data.comune_code, city: data.city, province: data.province ?? '', region: data.region ?? '' });
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
    setPrefillError(null);
    const trimmed = url.trim();
    if (GMAPS_RE.test(trimmed)) {
      const dup = prospects.find(
        (p) => p.google_maps_url?.trim() === trimmed && p.id !== prospect?.id,
      ) ?? null;
      setDuplicateProspect(dup);
      if (!dup) triggerPrefill(trimmed);
    } else {
      setDuplicateProspect(null);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} classes="max-w-2xl" labelledBy={titleId}>
      <>
        <DialogHeader
          titleId={titleId}
          title={isEdit ? prospect.name : 'Nuovo prospect'}
          subtitle={isEdit ? 'Modifica i dettagli o aggiorna lo stato' : 'Aggiungi un salone alla lista da chiamare'}
          onClose={onClose}
          className="pb-4"
        />

        {isEdit && (
          <TabBar label="Sezioni del prospect" className="px-6 pb-2 shrink-0 border-b border-line">
            {(
              [
                { key: 'post_call', label: 'Dopo la chiamata' },
                { key: 'pre_call',  label: 'Prima della chiamata' },
              ] as const
            ).map(({ key, label }) => (
              <TabButton
                key={key}
                id={`tab-${key}`}
                aria-controls={`panel-${key}`}
                active={activeTab === key}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </TabButton>
            ))}
          </TabBar>
        )}
        {!isEdit && <div className="border-b border-line" aria-hidden />}

        <div className="p-6 flex-1 min-h-0 overflow-y-auto space-y-6">

          {/* ── POST-CALL TAB (edit only, default) ─────────────────────────── */}
          {isEdit && prospect && activeTab === 'post_call' && (
            <div role="tabpanel" id="panel-post_call" aria-labelledby="tab-post_call" className="space-y-6">
              {/* Status section */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium tracking-tight text-[var(--lume-text)]">Stato</h3>
                  <div className="flex items-center gap-3 text-xs text-[var(--lume-text-secondary)]">
                    <span>Chiamate: <span className="tabular-nums text-[var(--lume-text)]">{prospect.call_count}</span></span>
                    {prospect.last_call_at && (
                      <span>Ultima: <span className="tabular-nums text-[var(--lume-text)]">{new Date(prospect.last_call_at).toLocaleDateString('it-IT')}</span></span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROSPECT_STATUSES.map((s) => {
                    const active = prospect.status === s;
                    return (
                      <Button
                        key={s}
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(s)}
                        pressed={active}
                        className="max-md:h-11"
                      >
                        <ProspectStatusChip status={s} />
                      </Button>
                    );
                  })}
                </div>
                {prospect.status === 'callback_scheduled' && (
                  <div className="text-xs text-[var(--lume-text-secondary)]">
                    Per impostare/aggiornare la data di richiamo, usa la sessione di chiamata.
                  </div>
                )}
                {prospect.callback_at && (
                  <div className="text-xs text-[var(--lume-text-secondary)]">
                    Da richiamare il <span className="tabular-nums text-[var(--lume-text)]">
                      {new Date(prospect.callback_at).toLocaleString('it-IT')}
                    </span>
                  </div>
                )}
              </section>

              <div className="border-t border-line" />

              {/* Post-call fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Telefono titolare"
                  autoFocus
                  value={form.phone_personal}
                  onChange={(e) => setForm((s) => ({ ...s, phone_personal: e.target.value }))}
                  placeholder="+39 333 1234567"
                  inputMode="tel"
                />

                <FormInput
                  label="Titolare"
                  value={form.owner_name}
                  onChange={(e) => setForm((s) => ({ ...s, owner_name: e.target.value }))}
                  placeholder="Mario Rossi"
                />

                <div className="md:col-span-2">
                  <FormInput
                    label="Software in uso"
                    value={form.current_software}
                    onChange={(e) => setForm((s) => ({ ...s, current_software: e.target.value }))}
                    placeholder="Treatwell, agenda cartacea, …"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── PRE-CALL TAB (edit) or flat add form ───────────────────────── */}
          {(!isEdit || activeTab === 'pre_call') && (
            <div role="tabpanel" id="panel-pre_call" aria-labelledby="tab-pre_call">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Maps URL first — paste to auto-fill everything */}
              <div className="md:col-span-2 space-y-2">
                <FormInput
                  label={
                    <span className="inline-flex items-center gap-2">
                      Link Google Maps
                      {prefilling && (
                        <span className="flex items-center gap-1 text-xs text-[var(--lume-text-secondary)]">
                          <Loader2 className="size-3 animate-spin" />
                          Ricerca in corso…
                        </span>
                      )}
                      {prefillDone && !prefilling && (
                        <span className="flex items-center gap-1 text-xs text-success-strong">
                          <CheckCircle2 className="size-3" />
                          Compilato automaticamente
                        </span>
                      )}
                      {prefillError && !prefilling && (
                        <span className="text-xs text-danger-strong">{prefillError}</span>
                      )}
                    </span>
                  }
                  value={form.google_maps_url}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  placeholder="Incolla il link di Google Maps per compilare i campi in automatico…"
                  type="url"
                  autoFocus={!isEdit}
                  disabled={prefilling}
                />
                {duplicateProspect && (
                  <Callout tone="warning">
                    <span className="text-[var(--lume-text)]">
                      Questo link è già in lista come{' '}
                      <span className="font-medium">{duplicateProspect.name}</span>.
                      Salvataggio non consentito.
                    </span>
                  </Callout>
                )}
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

              <div className="md:col-span-2">
                <ComuneAutocomplete
                  label="Comune"
                  value={comune}
                  onChange={setComune}
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Indirizzo"
                  value={form.address}
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                  placeholder="Via Roma 12, Milano"
                />
              </div>

              <TextArea
                id="prospect-notes"
                label="Note"
                fieldClassName="md:col-span-2"
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Qualunque dettaglio utile prima della chiamata…"
                rows={3}
              />
            </div>
            </div>
          )}

        </div>

        <DialogFooter
          start={isEdit && prospect && onDeleteRequest ? (
            <Button
              variant="ghost-destructive"
              leadingIcon={Trash2}
              onClick={() => { onDeleteRequest(prospect); }}
            >
              Elimina
            </Button>
          ) : undefined}
        >
          {isEdit && <ProspectStatusChip status={prospect?.status ?? 'not_contacted'} className="mr-2" />}
          <Button variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button
            variant="primary"
            leadingIcon={Check}
            disabled={submitting || !!duplicateProspect}
            onClick={handleSubmit}
          >
            {isEdit ? 'Salva' : 'Aggiungi'}
          </Button>
        </DialogFooter>
      </>
    </Modal>
  );
}
