import { Lightbulb, Bug, Sparkles, type LucideIcon } from 'lucide-react';
import type { FeedbackStatus, FeedbackType } from '@/lib/types/FeedbackEntry';
import type { StatusTone } from '@/lib/components/shared/ui/StatusDot';

// Type is a category, not a state: icon + word in neutral text. `badge` is the
// icon colour, kept faintly tinted so the three types stay tellable at a glance.
export const TYPE_META: Record<FeedbackType, { label: string; icon: LucideIcon; badge: string; dot: string }> = {
  suggestion: {
    label: 'Suggerimento',
    icon: Lightbulb,
    badge: 'text-info-strong',
    dot: 'bg-info-strong',
  },
  bug: {
    label: 'Problema',
    icon: Bug,
    badge: 'text-danger-strong',
    dot: 'bg-danger-strong',
  },
  idea: {
    label: 'Idea',
    icon: Sparkles,
    badge: 'text-warning-strong',
    dot: 'bg-warning-strong',
  },
};

// Status: a dot beside a neutral word, drawn by <StatusDot tone>.
export const STATUS_META: Record<FeedbackStatus, { label: string; tone: StatusTone }> = {
  open: { label: 'Aperto', tone: 'neutral' },
  in_progress: { label: 'In lavorazione', tone: 'info' },
  completed: { label: 'Completato', tone: 'success' },
  closed: { label: 'Chiuso', tone: 'neutral' },
};
