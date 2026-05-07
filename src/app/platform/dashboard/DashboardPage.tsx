'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
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
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Clock,
  Euro,
  Sparkles,
  TrendingUp,
  Trophy,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { MilestonesCard } from '@/lib/components/platform/MilestonesCard';

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

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
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
  }, [target, durationMs]);
  return value;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const statusStyles: Record<string, { bg: string; fg: string; label: string }> = {
  active:     { bg: 'bg-emerald-500/15', fg: 'text-emerald-600 dark:text-emerald-400', label: 'Attivo'     },
  trialing:   { bg: 'bg-blue-500/15',    fg: 'text-blue-600 dark:text-blue-400',       label: 'Trial'      },
  past_due:   { bg: 'bg-amber-500/15',   fg: 'text-amber-700 dark:text-amber-400',     label: 'Scaduto'    },
  unpaid:     { bg: 'bg-red-500/15',     fg: 'text-red-600 dark:text-red-400',         label: 'Non pagato' },
  canceled:   { bg: 'bg-zinc-500/15',    fg: 'text-zinc-600 dark:text-zinc-400',       label: 'Annullato'  },
  incomplete: { bg: 'bg-zinc-500/15',    fg: 'text-zinc-600 dark:text-zinc-400',       label: 'Incompleto' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function DashboardPage({ data }: { data: DashboardData }) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
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
            accent="indigo"
            numeric={data.mrrCents}
            format={(n) => formatEur(n)}
            hint={`Da ${data.payingCount} ${data.payingCount === 1 ? 'salone' : 'saloni'}`}
            trendPct={data.mrrTrendPct}
            sparkline={data.monthlySignups.map((m) => m.total)}
          />
          <KpiCard
            label="ARR"
            icon={TrendingUp}
            accent="emerald"
            numeric={data.arrCents}
            format={(n) => formatEur(n, { compact: true })}
            hint="Stima su MRR × 12"
            trendPct={data.mrrTrendPct}
          />
          <KpiCard
            label="Saloni paganti"
            icon={Building2}
            accent="blue"
            numeric={data.payingCount}
            format={(n) => formatInt(n)}
            hint={`${data.totalSalons} totali · ${data.statusCounts.trialing ?? 0} in trial`}
            trendPct={data.payingTrendPct}
          />
          <KpiCard
            label="Volume servizi (30g)"
            icon={Activity}
            accent="violet"
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
            <SignupsCard data={data} />
          </div>
          <div className="flex flex-col gap-4">
            <StatusCard data={data} />
            <PlanSplitCard data={data} />
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
        hidden:  { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KpiCard — animated count, sparkline, trend pill
// ─────────────────────────────────────────────────────────────────────────────
const accentMap = {
  indigo:  { bg: 'bg-indigo-500/10',  fg: 'text-indigo-500',  stroke: '#6366F1', fill: 'rgba(99,102,241,0.18)' },
  emerald: { bg: 'bg-emerald-500/10', fg: 'text-emerald-500', stroke: '#10b981', fill: 'rgba(16,185,129,0.18)' },
  blue:    { bg: 'bg-blue-500/10',    fg: 'text-blue-500',    stroke: '#3b82f6', fill: 'rgba(59,130,246,0.18)' },
  violet:  { bg: 'bg-violet-500/10',  fg: 'text-violet-500',  stroke: '#8b5cf6', fill: 'rgba(139,92,246,0.18)' },
} as const;

function KpiCard({
  label,
  icon: Icon,
  numeric,
  format,
  hint,
  trendPct,
  accent,
  sparkline,
}: {
  label:     string;
  icon:      ComponentType<{ className?: string; strokeWidth?: number }>;
  numeric:   number;
  format:    (n: number) => string;
  hint?:     string;
  trendPct:  number | null;
  accent:    keyof typeof accentMap;
  sparkline?: number[];
}) {
  const animated = useCountUp(numeric);
  const color = accentMap[accent];
  const up = trendPct != null && trendPct >= 0;

  return (
    <div className="relative overflow-hidden flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${color.bg}`}>
            <Icon className={`w-4 h-4 ${color.fg}`} strokeWidth={2} />
          </div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
            {label}
          </p>
        </div>

        {trendPct != null && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
              up
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trendPct).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-white leading-none">
        {format(animated)}
      </p>

      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{hint}</p>
      )}

      {sparkline && sparkline.length > 1 && (
        <Sparkline values={sparkline} stroke={color.stroke} fill={color.fill} />
      )}
    </div>
  );
}

function Sparkline({ values, stroke, fill }: { values: number[]; stroke: string; fill: string }) {
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-10 -mb-1 mt-1" aria-hidden>
      <polygon points={area} fill={fill} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SignupsCard — 6-month signup growth (area chart)
// ─────────────────────────────────────────────────────────────────────────────
function SignupsCard({ data }: { data: DashboardData }) {
  const hasData = data.monthlySignups.some((m) => m.count > 0);
  const total6m = data.monthlySignups.reduce((s, m) => s + m.count, 0);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
            Crescita saloni
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ultimi 6 mesi · {total6m} {total6m === 1 ? 'nuovo salone' : 'nuovi saloni'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          <LegendDot color="#6366F1" label="Mensile" />
          <LegendDot color="#10b981" label="Annuale" />
        </div>
      </div>

      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlySignups} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="gradMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradYearly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-zinc-500 dark:text-zinc-400" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-zinc-500 dark:text-zinc-400" width={36} />
              <Tooltip
                cursor={{ stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1 }}
                content={<ChartTooltipBox />}
              />
              <Area
                type="monotone"
                dataKey="monthly"
                stackId="1"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#gradMonthly)"
                animationDuration={800}
              />
              <Area
                type="monotone"
                dataKey="yearly"
                stackId="1"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradYearly)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart label="Nessun salone registrato negli ultimi 6 mesi" />
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ChartTooltipBox({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-zinc-900 dark:text-white capitalize mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 tabular-nums">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-zinc-500 dark:text-zinc-400 capitalize">{p.name === 'monthly' ? 'Mensile' : p.name === 'yearly' ? 'Annuale' : p.name}:</span>
          <span className="font-medium text-zinc-900 dark:text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-400 dark:text-zinc-500">
      <Sparkles className="w-8 h-8 mb-2" strokeWidth={1.5} />
      <p className="text-xs">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusCard — donut of subscription statuses
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active:     '#10b981',
  trialing:   '#3b82f6',
  past_due:   '#f59e0b',
  unpaid:     '#ef4444',
  canceled:   '#71717a',
  incomplete: '#a1a1aa',
};

function StatusCard({ data }: { data: DashboardData }) {
  const entries = Object.entries(data.statusCounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  const pieData = entries.map(([status, value]) => ({
    name:  statusStyles[status]?.label ?? status,
    value,
    color: STATUS_COLORS[status] ?? '#a1a1aa',
  }));

  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
        Stato abbonamenti
      </h2>

      {total > 0 ? (
        <div className="flex items-center gap-4">
          <div className="relative w-28 h-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={34}
                  outerRadius={54}
                  stroke="none"
                  animationDuration={700}
                >
                  {pieData.map((p, i) => (
                    <Cell key={i} fill={p.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-white leading-none">
                {total}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5">
                saloni
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-zinc-600 dark:text-zinc-300 truncate">{p.name}</span>
                </span>
                <span className="font-medium tabular-nums text-zinc-900 dark:text-white">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">Nessun abbonamento</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanSplitCard — horizontal bars for monthly vs yearly among active
// ─────────────────────────────────────────────────────────────────────────────
function PlanSplitCard({ data }: { data: DashboardData }) {
  const totalActive = data.activeMonthly + data.activeYearly;
  const monthlyPct = totalActive > 0 ? (data.activeMonthly / totalActive) * 100 : 0;
  const yearlyPct  = totalActive > 0 ? (data.activeYearly  / totalActive) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
        Distribuzione piani
      </h2>

      {totalActive > 0 ? (
        <div className="flex flex-col gap-3">
          <PlanBar label="Mensile"  count={data.activeMonthly} pct={monthlyPct} color="#6366F1" />
          <PlanBar label="Annuale"  count={data.activeYearly}  pct={yearlyPct}  color="#10b981" />
        </div>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3">Nessun abbonamento attivo</p>
      )}
    </div>
  );
}

function PlanBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-zinc-700 dark:text-zinc-200 font-medium">{label}</span>
        </span>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          <span className="text-zinc-900 dark:text-white font-semibold">{count}</span> · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
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
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              Trial in scadenza
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Prossimi 7 giorni
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
          {data.trialsEnding.length}
        </span>
      </div>

      {data.trialsEnding.length > 0 ? (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 -mx-2">
          {data.trialsEnding.map((t) => (
            <li key={t.id}>
              <Link
                href="/platform/dashboard"
                className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <SalonAvatar name={t.name} logoUrl={t.logoUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{t.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Scade il {formatDate(t.trialEndsAt)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                    t.daysLeft <= 2
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {t.daysLeft === 0 ? 'Oggi' : t.daysLeft === 1 ? '1 giorno' : `${t.daysLeft} giorni`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
          <Clock className="w-7 h-7 mb-2" strokeWidth={1.5} />
          <p className="text-xs">Nessun trial in scadenza</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopSalonsCard — leaderboard by revenue (30d)
// ─────────────────────────────────────────────────────────────────────────────
function TopSalonsCard({ data }: { data: DashboardData }) {
  const max = Math.max(...data.topSalons.map((s) => s.revenue), 1);

  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10">
            <Trophy className="w-4 h-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              Top saloni · per fatturato
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ultimi 30 giorni · servizi
            </p>
          </div>
        </div>
      </div>

      {data.topSalons.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {data.topSalons.map((s, i) => {
            const pct = (s.revenue / max) * 100;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums shrink-0">
                  {i + 1}
                </span>
                <SalonAvatar name={s.name} logoUrl={s.logoUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white shrink-0">
                      {formatEur(s.revenue)}
                    </p>
                  </div>
                  <div className="relative h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.05 }}
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
          <Euro className="w-7 h-7 mb-2" strokeWidth={1.5} />
          <p className="text-xs">Nessun servizio registrato negli ultimi 30 giorni</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecentSignupsCard — latest 5 salons
// ─────────────────────────────────────────────────────────────────────────────
function RecentSignupsCard({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10">
            <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              Ultimi saloni registrati
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {data.signups30} {data.signups30 === 1 ? 'nuovo salone' : 'nuovi saloni'} negli ultimi 30 giorni
            </p>
          </div>
        </div>
        <Link
          href="/platform/salons"
          className="text-xs font-medium text-primary hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          Vedi tutti →
        </Link>
      </div>

      {data.recentSignups.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          {data.recentSignups.map((s) => {
            const st = statusStyles[s.status] ?? statusStyles.incomplete;
            const plan = s.plan === 'yearly' ? 'Annuale' : s.plan === 'monthly' ? 'Mensile' : '—';
            return (
              <li
                key={s.id}
                className="flex flex-col gap-2 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SalonAvatar name={s.name} logoUrl={s.logoUrl} size="sm" />
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{s.name}</p>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded-full font-medium ${st.bg} ${st.fg}`}>
                    {st.label}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">{plan}</span>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                  {formatDate(s.createdAt)}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-500">
          <UserPlus className="w-7 h-7 mb-2" strokeWidth={1.5} />
          <p className="text-xs">Nessun salone registrato</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalonAvatar — logo or initials circle
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
        className="rounded-md object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
      />
    );
  }
  return (
    <div
      className="rounded-md bg-primary/15 dark:bg-primary/20 flex items-center justify-center shrink-0"
      style={{ width: dim, height: dim }}
    >
      <span className="text-[10px] font-semibold text-primary-hover dark:text-primary/80 leading-none">
        {getInitials(name)}
      </span>
    </div>
  );
}
