'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useFeedbackStore } from '@/lib/stores/feedback';
import type { FeedbackType } from '@/lib/types/FeedbackEntry';
import { RichTextEditor } from '@/lib/components/shared/ui/RichTextEditor';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { OptionGroup, type Option } from '@/lib/components/shared/ui/forms/OptionGroup';
import { ImageUploader } from './ImageUploader';
import { TYPE_META } from './feedback-meta';

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
  initialImagePaths?: string[];
}

const TYPE_OPTIONS: Option<FeedbackType>[] = (['suggestion', 'bug', 'idea'] as const).map((value) => ({
  value,
  label: TYPE_META[value].label,
  icon: TYPE_META[value].icon,
}));
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

  return (
    <AddModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Nuovo feedback"
      subtitle="Suggerisci una funzionalità, segnala un problema o condividi un'idea"
      classes="max-w-2xl"
      confirmText={isSubmitting ? 'Pubblicazione…' : 'Pubblica'}
      confirmDisabled={!canSubmit}
    >
      <div className="flex flex-col gap-6">
        <Field label="Tipo">
          {() => (
            <OptionGroup<FeedbackType>
              ariaLabel="Tipo di feedback"
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
            />
          )}
        </Field>

        <FormInput
          label={<>Titolo <span className="text-[var(--lume-text-muted)]">({title.trim().length}/120)</span></>}
          maxLength={120}
          value={title}
          placeholder="Riassumi in una frase"
          onChange={(e) => setTitle(e.target.value)}
        />

        <Field
          label={<>Descrizione <span className={descriptionLength > 4000 ? 'text-danger-strong' : 'text-[var(--lume-text-muted)]'}>({descriptionLength}/4000)</span></>}
        >
          {() => (
            <RichTextEditor
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Descrivi il contesto, cosa ti aspettavi, cosa è successo, qualsiasi dettaglio utile…"
              minHeight={180}
            />
          )}
        </Field>

        <Field label="Allegati">
          {() => <ImageUploader kind="feedback" paths={imagePaths} onChange={setImagePaths} />}
        </Field>
      </div>
    </AddModal>
  );
}
