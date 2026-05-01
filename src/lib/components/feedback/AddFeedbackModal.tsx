'use client';

import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useFeedbackStore } from '@/lib/stores/feedback';
import type { FeedbackType } from '@/lib/types/FeedbackEntry';
import { RichTextEditor } from '@/lib/components/shared/ui/RichTextEditor';
import { ImageUploader } from './ImageUploader';
import { TYPE_META } from './feedback-meta';

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
  initialImagePaths?: string[];
}

const TYPE_ORDER: FeedbackType[] = ['suggestion', 'bug', 'idea'];
const BUCKET = 'feedback-attachments';

export function AddFeedbackModal({ isOpen, onClose, initialType, initialImagePaths }: AddFeedbackModalProps) {
  const addEntry = useFeedbackStore((s) => s.addEntry);

  const [type, setType] = useState<FeedbackType>(initialType ?? 'suggestion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [imagePaths, setImagePaths] = useState<string[]>(initialImagePaths ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(initialType ?? 'suggestion');
      setTitle('');
      setDescription('');
      setDescriptionLength(0);
      setImagePaths(initialImagePaths ?? []);
      setIsSubmitting(false);
    }
  }, [isOpen, initialType, initialImagePaths]);

  const canSubmit = title.trim().length >= 3 && descriptionLength >= 1 && descriptionLength <= 4000 && !isSubmitting;

  const handleDescriptionChange = (html: string, plainText: string) => {
    setDescription(html);
    setDescriptionLength(plainText.trim().length);
  };

  const handleClose = async () => {
    // Clean up any uploaded-but-not-posted attachments. Best-effort.
    if (imagePaths.length > 0 && !isSubmitting) {
      await supabase.storage.from(BUCKET).remove(imagePaths);
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await addEntry({
        type,
        title: title.trim(),
        description: description.trim(),
        image_paths: imagePaths,
      });
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
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Nuovo feedback"
      subtitle="Suggerisci una funzionalità, segnala un problema o condividi un'idea"
      icon={MessageSquare}
      classes="max-w-2xl"
      contentClasses="overflow-y-auto"
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
            Descrizione <span className={`font-normal ${descriptionLength > 4000 ? 'text-red-500' : 'text-zinc-400'}`}>({descriptionLength}/4000)</span>
          </label>
          <RichTextEditor
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Descrivi il contesto, cosa ti aspettavi, cosa è successo, qualsiasi dettaglio utile…"
            minHeight={180}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Allegati</label>
          <ImageUploader kind="feedback" paths={imagePaths} onChange={setImagePaths} />
        </div>
      </div>
    </AddModal>
  );
}
