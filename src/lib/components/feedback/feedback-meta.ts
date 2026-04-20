import { Lightbulb, Bug, Sparkles, type LucideIcon } from 'lucide-react';
import type { FeedbackStatus, FeedbackType } from '@/lib/types/FeedbackEntry';

export const TYPE_META: Record<FeedbackType, { label: string; icon: LucideIcon; badge: string; dot: string }> = {
  suggestion: {
    label: 'Suggerimento',
    icon: Lightbulb,
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
  bug: {
    label: 'Bug',
    icon: Bug,
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  idea: {
    label: 'Idea',
    icon: Sparkles,
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
};

export const STATUS_META: Record<FeedbackStatus, { label: string; badge: string }> = {
  open: {
    label: 'Aperto',
    badge: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
  },
  in_progress: {
    label: 'In lavorazione',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  completed: {
    label: 'Completato',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  closed: {
    label: 'Chiuso',
    badge: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
  },
};
