'use client';

import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useFeedbackStore } from '@/lib/stores/feedback';
import type { FeedbackType } from '@/lib/types/FeedbackEntry';
import { TYPE_META } from './feedback-meta';

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ORDER: FeedbackType[] = ['suggestion', 'bug', 'idea'];

export function AddFeedbackModal({ isOpen, onClose }: AddFeedbackModalProps) {
  const addEntry = useFeedbackStore((s) => s.addEntry);

  const [type, setType] = useState<FeedbackType>('suggestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType('suggestion');
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const canSubmit = title.trim().length >= 3 && description.trim().length >= 1 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await addEntry({ type, title: title.trim(), description: description.trim() });
      messagePopup.getState().success('Feedback pubblicato. Grazie!');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la pubblicazione: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-shadow';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuovo feedback"
      subtitle="Suggerisci una funzionalità, segnala un bug o condividi un'idea"
      icon={MessageSquare}
      classes="max-w-2xl"
      confirmText={isSubmitting ? 'Pubblicazione…' : 'Pubblica'}
      confirmDisabled={!canSubmit}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_ORDER.map((value) => {
              const meta = TYPE_META[value];
              const isSelected = type === value;
              const Icon = meta.icon;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg border text-sm transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10 dark:bg-primary/10 text-primary-hover dark:text-primary/70'
                      : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                  <span className="leading-tight text-center">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Titolo <span className="text-zinc-400 font-normal">({title.trim().length}/120)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            maxLength={120}
            value={title}
            placeholder="Riassumi in una frase"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Descrizione <span className="text-zinc-400 font-normal">({description.trim().length}/4000)</span>
          </label>
          <textarea
            rows={8}
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrivi il contesto, cosa ti aspettavi, cosa è successo, qualsiasi dettaglio utile…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>
    </AddModal>
  );
}
