'use client';

import { CreditCard, ChevronRight } from 'lucide-react';

export function AbbonamentoPanel() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gestione Abbonamento</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Visualizza e gestisci il tuo piano Lume.</p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Piano attuale</p>
                <p className="text-xs text-zinc-500 mt-0.5">Attiva o modifica il tuo abbonamento.</p>
              </div>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-active disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Gestisci
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Fatturazione</p>
                <p className="text-xs text-zinc-500 mt-0.5">Storico pagamenti e metodo di pagamento.</p>
              </div>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-active disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Visualizza
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
