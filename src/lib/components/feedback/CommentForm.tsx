'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { RichTextEditor } from '@/lib/components/shared/ui/RichTextEditor';
import { Button } from '@/lib/components/shared/ui/Button';
import { ImageUploader } from './ImageUploader';

interface CommentFormProps {
  initialBody?: string;
  initialImagePaths?: string[];
  submitLabel?: string;
  onSubmit: (data: { body: string; image_paths: string[] }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

const MAX_LENGTH = 4000;

export function CommentForm({
  initialBody = '',
  initialImagePaths = [],
  submitLabel = 'Invia',
  onSubmit,
  onCancel,
  placeholder = 'Scrivi un commento…',
}: CommentFormProps) {
  const [body, setBody] = useState(initialBody);
  const [plainLength, setPlainLength] = useState(initialBody.replace(/<[^>]*>/g, '').trim().length);
  const [imagePaths, setImagePaths] = useState<string[]>(initialImagePaths);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = plainLength >= 1 && plainLength <= MAX_LENGTH && !isSubmitting;

  const handleEditorChange = (html: string, plainText: string) => {
    setBody(html);
    setPlainLength(plainText.trim().length);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ body: body.trim(), image_paths: imagePaths });
      if (!initialBody) {
        setBody('');
        setPlainLength(0);
        setImagePaths([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="surface-card flex flex-col gap-2 p-3">
      <div className="flex flex-row items-center justify-end">
        <span className={`text-xs tabular-nums ${plainLength > MAX_LENGTH ? 'text-danger-strong' : 'text-[var(--lume-text-muted)]'}`}>
          {plainLength}/{MAX_LENGTH}
        </span>
      </div>

      <RichTextEditor
        value={body}
        onChange={handleEditorChange}
        placeholder={placeholder}
      />

      <ImageUploader kind="comments" paths={imagePaths} onChange={setImagePaths} />

      <div className="flex flex-row items-center justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Annulla
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          leadingIcon={Send}
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Invio…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
