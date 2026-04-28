'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { RichTextEditor } from '@/lib/components/shared/ui/RichTextEditor';
import { ImageUploader } from './ImageUploader';

interface CommentFormProps {
  initialBody?: string;
  initialImagePaths?: string[];
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (data: { body: string; image_paths: string[] }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

const MAX_LENGTH = 4000;

export function CommentForm({
  initialBody = '',
  initialImagePaths = [],
  submitLabel = 'Invia',
  disabled = false,
  onSubmit,
  onCancel,
  placeholder = 'Scrivi un commento…',
}: CommentFormProps) {
  const [body, setBody] = useState(initialBody);
  const [plainLength, setPlainLength] = useState(initialBody.replace(/<[^>]*>/g, '').trim().length);
  const [imagePaths, setImagePaths] = useState<string[]>(initialImagePaths);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = plainLength >= 1 && plainLength <= MAX_LENGTH && !isSubmitting && !disabled;

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
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800">
      <div className="flex flex-row items-center justify-end">
        <span className={`text-xs tabular-nums ${plainLength > MAX_LENGTH ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
          {plainLength}/{MAX_LENGTH}
        </span>
      </div>

      <RichTextEditor
        value={body}
        onChange={handleEditorChange}
        placeholder={placeholder}
        disabled={disabled}
      />

      <ImageUploader kind="comments" paths={imagePaths} onChange={setImagePaths} disabled={disabled} />

      <div className="flex flex-row items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            Annulla
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="size-3.5" />
          {isSubmitting ? 'Invio…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
