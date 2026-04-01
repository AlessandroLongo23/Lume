'use client';

import { useRef, useState } from 'react';
import { MessageSquare, X, Send, Wrench, Lightbulb, HelpCircle, Paperclip, ImageOff } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Non funziona', Icon: Wrench },
  { value: 'feature', label: 'Ho un\'idea', Icon: Lightbulb },
  { value: 'other', label: 'Altro', Icon: HelpCircle },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]['value'];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setType('bug');
    setMessage('');
    setImageBase64(null);
    setImageName(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      messagePopup.getState().error('L\'immagine supera il limite di 4 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URI prefix — Resend expects raw base64
      const raw = result.split(',')[1];
      setImageBase64(raw);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, imageBase64, imageName }),
      });

      if (!res.ok) throw new Error('request failed');

      messagePopup.getState().success('Grazie per il feedback! 🙏');
      handleClose();
    } catch {
      messagePopup.getState().error('Errore durante l\'invio. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} classes="max-w-md">
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">

        {/* Header */}
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-indigo-500/10">
              <MessageSquare className="size-5 text-indigo-500" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Invia Feedback</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Aiutaci a migliorare Lume</p>
            </div>
          </div>
          <button
            className="shrink-0 ml-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={handleClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Di cosa si tratta?</label>
            <div className="grid grid-cols-3 gap-2">
              {FEEDBACK_TYPES.map(({ value, label, Icon }) => {
                const isSelected = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg border text-sm transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                    <span className="leading-tight text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Messaggio</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descrivi il problema o la tua idea..."
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Screenshot attachment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Screenshot <span className="font-normal text-zinc-400">(opzionale, max 4 MB)</span>
            </label>
            {imageName ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900">
                <Paperclip className="size-4 shrink-0 text-indigo-500" />
                <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">{imageName}</span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <ImageOff className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-500 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                <Paperclip className="size-4 shrink-0" />
                Allega uno screenshot
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-row items-center justify-end gap-3 p-6 border-t border-zinc-500/25">
          <button
            type="button"
            onClick={handleClose}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100"
          >
            <X className="size-4" />
            Annulla
          </button>
          <button
            type="button"
            disabled={!message.trim() || isSubmitting}
            onClick={handleSubmit}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-indigo-600"
          >
            <Send className="size-4" />
            {isSubmitting ? 'Invio...' : 'Invia'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
