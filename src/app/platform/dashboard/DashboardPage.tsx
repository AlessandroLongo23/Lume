'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock,
  Euro,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { MilestonesCard } from '@/lib/components/platform/MilestonesCard';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { Button } from '@/lib/components/shared/ui/Button';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { subscriptionStatus } from '@/lib/components/platform/subscriptionStatus';

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirrors output of computeDashboard in page.tsx)
// ─────────────────────────────────────────────────────────────────────────────
export type DashboardData = {
  mrrCents:          number;
  mrrTrendPct:       number | null;
  arrCents:          number;
  payingCount:       number;
  payingTrendPct:    number | null;
  signups30:         number;
  signupsTrendPct:   number | null;
  gmvCents:          number;
  gmvTrendPct:       number | null;
  totalSalons:       number;
  statusCounts:      Record<string, number>;
  activeMonthly:     number;
  activeYearly:      number;
  monthlySignups:    { month: string; count: number; monthly: number; yearly: number; total: number }[];
  trialsEnding:      { id: string; name: string; logoUrl: string | null; trialEndsAt: string; daysLeft: number }[];
  topSalons:         { id: string; name: string; logoUrl: string | null; status: string; revenue: number }[];
  recentSignups:     { id: string; name: string; logoUrl: string | null; status: string; plan: string | null; createdAt: string }[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatEur = (cents: number, opts?: { compact?: boolean }) =>
  new Intl.NumberFormat('it-IT', {
    style:    'currency',
    currency: 'EUR',
    notation: opts?.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts?.compact ? 1 : 2,
  }).format(cents / 100);

const formatInt = (n: number) => new Intl.NumberFormat('it-IT').format(Math.round(n));

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

/** `--duration-count` in milliseconds, for the requestAnimationFrame count-up. */
const COUNT_UP_MS = DURATION.count * 1000;

function useCountUp(target: number, durationMs = COUNT_UP_MS) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion: show the final number at once.
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduceMotion]);
  return value;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Recharts writes colours into SVG attributes, which cannot resolve CSS
// variables, so the chart palette is read from the theme tokens at runtime.
type ChartColors = {
  monthly: string;
  yearly:  string;
  grid:    string;
  axis:    string;
  status:  Record<string, string>;
};

const FALLBACK_COLORS: ChartColors = {
  monthly: 'currentColor',
  yearly:  'currentColor',
  grid:    'currentColor',
  axis:    'currentColor',
  status:  {},
};

function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(FALLBACK_COLORS);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim() || 'currentColor';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tokens only exist in the browser.
    setColors({
      monthly: v('--lume-series-1'),
      yearly:  v('--lume-series-3'),
      grid:    v('--lume-line'),
      axis:    v('--lume-text-muted'),
      status: {
        active:     v('--lume-success-fg'),
        trialing:   v('--lume-info-fg'),
        past_due:   v('--lume-warning-fg'),
        unpaid:     v('--lume-danger-fg'),
        canceled:   v('--lume-text-muted'),
        incomplete: v('--lume-strong'),
      },
    });
  }, [resolvedTheme]);
  return colors;
}

const CARD = 'surface-card';

function CardHeader({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-medium tracking-tight text-[var(--lume-text)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--lume-text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}

function EmptyNote({ icon: Icon, label, tall }: { icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; tall?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-[var(--lume-text-muted)] ${tall ? 'h-64' : 'py-8'}`}>
      <Icon className="size-6 mb-2" strokeWidth={1.5} />
      <p className="text-xs text-[var(--lume-text-secondary)]">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function DashboardPage({ data }: { data: DashboardData }) {
  const reduceMotion = useReducedMotion();
  const colors = useChartColors();
  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {/* ─ Milestones ────────────────────────────────────────────────── */}
      <Row>
        <MilestonesCard
          activePlusTrial={data.payingCount + (data.statusCounts.trialing ?? 0)}
        />
      </Row>

      {/* ─ Hero KPI row ──────────────────────────────────────────────── */}
      <Row>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="MRR"
            icon={Wallet}
            numeric={data.mrrCents}
            format={(n) => formatEur(n)}
            hint={`Da ${data.payingCount} ${data.payingCount === 1 ? 'salone' : 'saloni'}`}
            trendPct={data.mrrTrendPct}
            sparkline={data.monthlySignups.map((m) => m.total)}
          />
          <KpiCard
            label="ARR"
            icon={TrendingUp}
            numeric={data.arrCents}
            format={(n) => formatEur(n, { compact: true })}
            hint="Stima su MRR × 12"
            trendPct={data.mrrTrendPct}
          />
          <KpiCard
            label="Saloni paganti"
            icon={Building2}
            numeric={data.payingCount}
            format={(n) => formatInt(n)}
            hint={`${data.totalSalons} totali · ${data.statusCounts.trialing ?? 0} in prova`}
            trendPct={data.payingTrendPct}
          />
          <KpiCard
            label="Volume servizi (30 giorni)"
            icon={Activity}
            numeric={data.gmvCents}
            format={(n) => formatEur(n, { compact: true })}
            hint="Fatturato lordo generato"
            trendPct={data.gmvTrendPct}
          />
        </div>
      </Row>

      {/* ─ Growth chart + status donut ───────────────────────────────── */}
      <Row>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SignupsCard data={data} colors={colors} />
          </div>
          <div className="flex flex-col gap-4">
            <StatusCard data={data} colors={colors} />
            <PlanSplitCard data={data} colors={colors} />
          </div>
        </div>
      </Row>

      {/* ─ Trials ending + Top salons ────────────────────────────────── */}
      <Row>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrialsEndingCard data={data} />
          <TopSalonsCard data={data} />
        </div>
      </Row>

      {/* ─ Recent signups ────────────────────────────────────────────── */}
      <Row>
        <RecentSignupsCard data={data} />
      </Row>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row — a motion wrapper that fades/rises children in sequence
// ─────────────────────────────────────────────────────────────────────────────
function Row({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden:  { opacity: 0, y: 4 },
        visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KpiCard — big light number, small label, quiet trend
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  icon: Icon,
  numeric,
  format,
  hint,
  trendPct,
  sparkline,
}: {
  label:     string;
  icon:      ComponentType<{ className?: string; strokeWidth?: number }>;
  numeric:   number;
  format:    (n: number) => string;
  hint?:     string;
  trendPct:  number | null;
  sparkline?: number[];
}) {
  const animated = useCountUp(numeric);
  const up = trendPct != null && trendPct >= 0;

  return (
    <div className={`relative overflow-hidden flex flex-col gap-3 p-5 ${CARD}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 min-w-0 text-xs text-[var(--lume-text-secondary)]">
          <Icon className="size-3.5 shrink-0 text-[var(--lume-text-muted)]" strokeWidth={1.75} />
          <span className="truncate">{label}</span>
        </p>

        {trendPct != null && (
          <span className="flex items-center gap-1 text-xs tabular-nums text-[var(--lume-text-secondary)] shrink-0">
            <span className={up ? 'text-success-strong' : 'text-danger-strong'} aria-hidden>
              {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            </span>
            <span className="sr-only">{up ? 'In crescita del' : 'In calo del'}</span>
            {Math.abs(trendPct).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="text-3xl font-light tabular-nums tracking-tight text-[var(--lume-text)] leading-none">
        {format(animated)}
      </p>

      {hint && (
        <p className="text-xs text-[var(--lume-text-muted)] truncate">{hint}</p>
      )}

      {sparkline && sparkline.length > 1 && <Sparkline values={sparkline} />}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const area = `0,100 ${points} 100,100`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-10 -mb-1 mt-1 text-[var(--lume-text-secondary)]" aria-hidden>
      <polygon points={area} className="fill-hover" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SignupsCard — 6-month signup growth (area chart)
// ─────────────────────────────────────────────────────────────────────────────
function SignupsCard({ data, colors }: { data: DashboardData; colors: ChartColors }) {
  const hasData = data.monthlySignups.some((m) => m.count > 0);
  const total6m = data.monthlySignups.reduce((s, m) => s + m.count, 0);

  return (
    <div className={`flex flex-col gap-4 p-5 h-full ${CARD}`}>
      <CardHeader
        title="Crescita saloni"
        subtitle={`Ultimi 6 mesi · ${total6m} ${total6m === 1 ? 'nuovo salone' : 'nuovi saloni'}`}
        trailing={
          <div className="flex items-center gap-3 text-xs text-[var(--lume-text-secondary)] shrink-0">
            <LegendDot color={colors.monthly} label="Mensile" />
            <LegendDot color={colors.yearly} label="Annuale" />
          </div>
        }
      />

      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlySignups} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="gradMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={colors.monthly} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={colors.monthly} stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradYearly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={colors.yearly} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={colors.yearly} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.axis }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: colors.axis }} width={36} />
              <Tooltip
                cursor={{ stroke: colors.axis, strokeWidth: 1, strokeOpacity: 0.4 }}
                content={seriesTooltip}
              />
              <Area
                type="monotone"
                dataKey="monthly"
                stackId="1"
                stroke={colors.monthly}
                strokeWidth={1.5}
                fill="url(#gradMonthly)"
                animationDuration={600}
              />
              <Area
                type="monotone"
                dataKey="yearly"
                stackId="1"
                stroke={colors.yearly}
                strokeWidth={1.5}
                fill="url(#gradYearly)"
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyNote icon={Sparkles} label="Nessun salone registrato negli ultimi 6 mesi" tall />
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const seriesTooltip = makeRechartsTooltip((value, name) => [
  String(value),
  name === 'monthly' ? 'Mensile' : name === 'yearly' ? 'Annuale' : name,
]);

// ─────────────────────────────────────────────────────────────────────────────
// StatusCard — donut of subscription statuses
// ─────────────────────────────────────────────────────────────────────────────
function StatusCard({ data, colors }: { data: DashboardData; colors: ChartColors }) {
  const entries = Object.entries(data.statusCounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  const pieData = entries.map(([status, value]) => ({
    name:  subscriptionStatus(status).label,
    value,
    color: colors.status[status] ?? colors.status.incomplete ?? 'currentColor',
  }));

  return (
    <div className={`flex flex-col gap-3 p-5 ${CARD}`}>
      <CardHeader title="Stato abbonamenti" />

      {total > 0 ? (
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={38}
                  outerRadius={54}
                  stroke="none"
                  paddingAngle={pieData.length > 1 ? 2 : 0}
                  animationDuration={600}
                >
                  {pieData.map((p, i) => (
                    <Cell key={i} fill={p.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-light tabular-nums text-[var(--lume-text)] leading-none">
                {total}
              </span>
              <span className="text-2xs text-[var(--lume-text-secondary)] mt-1">
                saloni
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-[var(--lume-text-secondary)] truncate">{p.name}</span>
                </span>
                <span className="tabular-nums text-[var(--lume-text)]">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--lume-text-secondary)] py-6 text-center">Nessun abbonamento</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanSplitCard — horizontal bars for monthly vs yearly among active
// ─────────────────────────────────────────────────────────────────────────────
function PlanSplitCard({ data, colors }: { data: DashboardData; colors: ChartColors }) {
  const totalActive = data.activeMonthly + data.activeYearly;
  const monthlyPct = totalActive > 0 ? (data.activeMonthly / totalActive) * 100 : 0;
  const yearlyPct  = totalActive > 0 ? (data.activeYearly  / totalActive) * 100 : 0;

  return (
    <div className={`flex flex-col gap-3 p-5 ${CARD}`}>
      <CardHeader title="Distribuzione piani" />

      {totalActive > 0 ? (
        <div className="flex flex-col gap-3">
          <PlanBar label="Mensile"  count={data.activeMonthly} pct={monthlyPct} color={colors.monthly} />
          <PlanBar label="Annuale"  count={data.activeYearly}  pct={yearlyPct}  color={colors.yearly} />
        </div>
      ) : (
        <p className="text-xs text-[var(--lume-text-secondary)] py-3">Nessun abbonamento attivo</p>
      )}
    </div>
  );
}

function PlanBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[var(--lume-text)]">{label}</span>
        </span>
        <span className="tabular-nums text-[var(--lume-text-secondary)]">
          <span className="text-[var(--lume-text)]">{count}</span> · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-active overflow-hidden">
        <motion.div
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: DURATION.count, ease: EASE_OUT }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrialsEndingCard — actionable list of trials ending soon
// ─────────────────────────────────────────────────────────────────────────────
function TrialsEndingCard({ data }: { data: DashboardData }) {
  return (
    <div className={`flex flex-col gap-3 p-5 h-full ${CARD}`}>
      <CardHeader
        title="Prove in scadenza"
        subtitle="Prossimi 7 giorni"
        trailing={
          <span className="text-sm tabular-nums text-[var(--lume-text-secondary)]">
            {data.trialsEnding.length}
          </span>
        }
      />

      {data.trialsEnding.length > 0 ? (
        <ListBox role="list" className="-mx-2 p-0">
          {data.trialsEnding.map((t) => (
            <ListRow key={t.id} asChild>
              <Link href="/platform/dashboard" className="gap-3 px-2 py-2.5 min-h-11">
                <SalonAvatar name={t.name} logoUrl={t.logoUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--lume-text)] truncate">{t.name}</p>
                  <p className="text-xs text-[var(--lume-text-secondary)]">
                    Scade il <span className="tabular-nums">{formatDate(t.trialEndsAt)}</span>
                  </p>
                </div>
                <StatusDot tone={t.daysLeft <= 2 ? 'danger' : 'warning'} className="text-xs tabular-nums shrink-0">
                  {t.daysLeft === 0 ? 'Oggi' : t.daysLeft === 1 ? '1 giorno' : `${t.daysLeft} giorni`}
                </StatusDot>
              </Link>
            </ListRow>
          ))}
        </ListBox>
      ) : (
        <EmptyNote icon={Clock} label="Nessuna prova in scadenza" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopSalonsCard — leaderboard by revenue (30d)
// ─────────────────────────────────────────────────────────────────────────────
function TopSalonsCard({ data }: { data: DashboardData }) {
  const max = Math.max(...data.topSalons.map((s) => s.revenue), 1);
  const reduceMotion = useReducedMotion();

  return (
    <div className={`flex flex-col gap-3 p-5 h-full ${CARD}`}>
      <CardHeader title="Saloni con più fatturato" subtitle="Ultimi 30 giorni · servizi" />

      {data.topSalons.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {data.topSalons.map((s, i) => {
            const pct = (s.revenue / max) * 100;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span className="w-4 text-xs tabular-nums text-[var(--lume-text-muted)] text-right shrink-0">
                  {i + 1}
                </span>
                <SalonAvatar name={s.name} logoUrl={s.logoUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-[var(--lume-text)] truncate">{s.name}</p>
                    <p className="text-sm tabular-nums text-[var(--lume-text)] shrink-0">
                      {formatEur(s.revenue)}
                    </p>
                  </div>
                  <div className="relative h-1 rounded-full bg-active overflow-hidden">
                    <motion.div
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: DURATION.count, ease: EASE_OUT, delay: i * 0.04 }}
                      className="absolute inset-y-0 left-0 rounded-full bg-[var(--lume-text-secondary)]"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyNote icon={Euro} label="Nessun servizio registrato negli ultimi 30 giorni" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecentSignupsCard — latest 5 salons
// ─────────────────────────────────────────────────────────────────────────────
function RecentSignupsCard({ data }: { data: DashboardData }) {
  return (
    <div className={`flex flex-col gap-3 p-5 ${CARD}`}>
      <CardHeader
        title="Ultimi saloni registrati"
        subtitle={`${data.signups30} ${data.signups30 === 1 ? 'nuovo salone' : 'nuovi saloni'} negli ultimi 30 giorni`}
        trailing={
          <Button asChild variant="ghost" size="sm" className="-mr-2 max-md:h-11">
            <Link href="/platform/salons">
              Vedi tutti
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        }
      />

      {data.recentSignups.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line">
          {data.recentSignups.map((s) => {
            const st = subscriptionStatus(s.status);
            const plan = s.plan === 'yearly' ? 'Annuale' : s.plan === 'monthly' ? 'Mensile' : '—';
            return (
              <li
                key={s.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_8rem_6rem_5rem] items-center gap-x-4 gap-y-1 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SalonAvatar name={s.name} logoUrl={s.logoUrl} size="sm" />
                  <p className="text-sm font-medium text-[var(--lume-text)] truncate">{s.name}</p>
                </div>
                <StatusDot tone={st.tone} className="text-xs">{st.label}</StatusDot>
                <span className="hidden sm:block text-xs text-[var(--lume-text-secondary)]">{plan}</span>
                <span className="hidden sm:block text-xs tabular-nums text-[var(--lume-text-muted)] text-right">
                  {formatDate(s.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyNote icon={UserPlus} label="Nessun salone registrato" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalonAvatar — logo or initials tile
// ─────────────────────────────────────────────────────────────────────────────
function SalonAvatar({
  name,
  logoUrl,
  size = 'md',
}: {
  name:    string;
  logoUrl: string | null;
  size?:   'sm' | 'md';
}) {
  const dim = size === 'sm' ? 28 : 32;
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={dim}
        height={dim}
        className="rounded-md object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="rounded-md bg-active flex items-center justify-center shrink-0"
      style={{ width: dim, height: dim }}
    >
      <span className="text-2xs font-medium text-[var(--lume-text-secondary)] leading-none">
        {getInitials(name)}
      </span>
    </div>
  );
}
