import type { ComponentType, ReactNode, SVGProps } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'info' | 'success' | 'warning' | 'danger';
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const TONE: Record<Tone, { box: string; icon: string; Icon: IconComponent }> = {
  info: { box: 'bg-info-soft', icon: 'text-info-strong', Icon: Info },
  success: { box: 'bg-success-soft', icon: 'text-success-strong', Icon: CheckCircle2 },
  warning: { box: 'bg-warning-soft', icon: 'text-warning-strong', Icon: AlertTriangle },
  danger: { box: 'bg-danger-soft', icon: 'text-danger-strong', Icon: XCircle },
};

interface CalloutProps {
  tone?: Tone;
  title?: ReactNode;
  /** Overrides the tone's default icon. */
  icon?: IconComponent;
  /** Extra classes on the icon (e.g. `animate-spin` for a progress state). */
  iconClassName?: string;
  /** A button or link on the right (wraps under the text on phones). */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * An inline notice inside a page, form or dialog: a soft tinted field, the
 * tone's icon in colour, neutral text. Colour is never the only signal (icon
 * + words). Banners across the top of the app are the same component.
 */
export function Callout({ tone = 'info', title, icon, iconClassName, action, className, children }: CalloutProps) {
  const t = TONE[tone];
  const Icon = icon ?? t.Icon;
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex flex-wrap items-start gap-x-3 gap-y-2 rounded-lg px-3.5 py-3 text-sm', t.box, className)}
    >
      <Icon aria-hidden className={cn('size-4 shrink-0 mt-0.5', t.icon, iconClassName)} />
      <div className="min-w-0 flex-1 text-[var(--lume-text)]">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn('text-[var(--lume-text-secondary)]', title && 'mt-0.5')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
