'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { Button } from '@/lib/components/shared/ui/Button';
import { useOperatorsStore } from '@/lib/stores/operators';
import type { Client } from '@/lib/types/Client';
import type { PreviewSegment } from '@/lib/stores/calendarDrag';

interface Props {
  isOpen: boolean;
  client: Client | null;
  before: PreviewSegment[];
  after: PreviewSegment[];
  onConfirm: (notify: { email: boolean; whatsapp: boolean }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });
}

export function ConfirmAppointmentChangeModal({
  isOpen,
  client,
  before,
  after,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: Props) {
  const operators = useOperatorsStore((s) => s.operators);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  // Reset toggles whenever a new change is presented. Using a derived key would
  // force the parent to remount the modal — simpler to reset via effect here,
  // and the cascade is bounded (3 setState in a single render).
  useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setNotifyEmail(false);
    setNotifyWhatsApp(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, before, after]);

  const rows = useMemo(() => {
    return before.map((b, i) => ({
      before: b,
      after: after[i],
    }));
  }, [before, after]);

  const operatorChanged = before.length > 0 && after.length > 0
    && before[0].operatorId !== after[0].operatorId;

  const beforeOpName = operators.find((op) => op.id === before[0]?.operatorId)?.getFullName() ?? '—';
  const afterOpName = operators.find((op) => op.id === after[0]?.operatorId)?.getFullName() ?? '—';

  const canEmail = !!client?.email;
  const canWhatsapp = client?.hasPhone() ?? false;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} classes="max-w-md" backgroundBlur="sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl ring-1 ring-zinc-500/15 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CalendarIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Conferma modifica appuntamento
              </h2>
              {client && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {client.getFullName()}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg ring-1 ring-zinc-500/15 divide-y divide-zinc-500/10">
            {rows.map((row, idx) => (
              <div key={row.before.ficheServiceId} className="px-3 py-2 flex items-center gap-2 text-sm">
                <div className="text-zinc-500 dark:text-zinc-400 w-6 text-right shrink-0">{idx + 1}.</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 line-through">
                      {fmtDate(row.before.start)} · {fmtTime(row.before.start)}–{fmtTime(row.before.end)}
                    </span>
                    <ArrowRight className="size-3.5 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {fmtDate(row.after.start)} · {fmtTime(row.after.start)}–{fmtTime(row.after.end)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {operatorChanged && (
              <div className="px-3 py-2 flex items-center gap-2 text-sm bg-zinc-50 dark:bg-zinc-800/40">
                <div className="text-zinc-500 dark:text-zinc-400 w-6 text-right shrink-0">·</div>
                <div className="flex-1">
                  Operatore: <span className="text-zinc-500 dark:text-zinc-400 line-through mr-1">{beforeOpName}</span>
                  <ArrowRight className="inline size-3.5 text-zinc-400 mx-1" />
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{afterOpName}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Notifica al cliente</p>
            <div className="flex flex-col gap-2">
              <NotifyOption
                icon={Mail}
                label="Notifica via Email"
                description={canEmail ? client?.email ?? '' : 'Email non disponibile'}
                checked={notifyEmail}
                onChange={setNotifyEmail}
                disabled={!canEmail}
              />
              <NotifyOption
                icon={MessageCircle}
                label="Apri WhatsApp"
                description={canWhatsapp ? client?.getPhoneNumber() ?? '' : 'Telefono non disponibile'}
                checked={notifyWhatsApp}
                onChange={setNotifyWhatsApp}
                disabled={!canWhatsapp}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-zinc-50/60 dark:bg-zinc-950/40 border-t border-zinc-500/10">
          <Button variant="ghost" disabled={isSubmitting} onClick={onCancel}>
            Annulla
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            autoFocus
            onClick={() => onConfirm({ email: notifyEmail, whatsapp: notifyWhatsApp })}
          >
            {isSubmitting ? 'Salvataggio…' : 'Conferma'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface NotifyOptionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function NotifyOption({ icon: Icon, label, description, checked, onChange, disabled = false }: NotifyOptionProps) {
  return (
    <label
      className={`flex items-center gap-3 px-3 py-2 rounded-lg ring-1 ring-zinc-500/15 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <Icon className="size-4 text-zinc-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-900 dark:text-zinc-100">{label}</p>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{description}</p>
        )}
      </div>
    </label>
  );
}
