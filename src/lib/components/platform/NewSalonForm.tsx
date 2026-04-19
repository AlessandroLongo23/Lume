'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { BusinessType } from '@/lib/types/Salon';

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'barber',        label: 'Barbiere' },
  { value: 'hair_salon',    label: 'Parrucchiere' },
  { value: 'beauty_center', label: 'Centro estetico' },
  { value: 'nails',         label: 'Nail bar' },
  { value: 'other',         label: 'Altro' },
];

export function NewSalonForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('hair_salon');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch('/api/platform/salons', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, ownerEmail, ownerFirstName, ownerLastName, businessType }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Errore' }));
        throw new Error(payload.error || 'Errore');
      }
      router.push('/platform/salons');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setIsSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-primary';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Nome salone</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Tipo</span>
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value as BusinessType)} className={inputCls}>
          {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Proprietario</p>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Nome</span>
              <input required value={ownerFirstName} onChange={(e) => setOwnerFirstName(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Cognome</span>
              <input required value={ownerLastName} onChange={(e) => setOwnerLastName(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Email</span>
            <input required type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className={inputCls} />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-60"
      >
        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{isSaving ? 'Creazione…' : 'Crea salone'}</span>
      </button>
    </form>
  );
}
