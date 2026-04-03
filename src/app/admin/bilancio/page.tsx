'use client';

import { useEffect, useState, useMemo } from 'react';
import { Wallet, Landmark, TrendingUp } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useServicesStore } from '@/lib/stores/services';
import { useStatsStore } from '@/lib/stores/stats';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { KpiCard } from '@/lib/components/admin/bilancio/KpiCard';
import { RevenueChart } from '@/lib/components/admin/bilancio/RevenueChart';
import { TaxSimulatorCard } from '@/lib/components/admin/bilancio/TaxSimulatorCard';

type Period = 'month' | '3months' | 'year';

const PERIOD_OPTIONS: { value: Period; label: string; months: number }[] = [
  { value: 'month',   label: 'Questo Mese',   months: 1  },
  { value: '3months', label: 'Ultimi 3 Mesi', months: 3  },
  { value: 'year',    label: "Quest'Anno",     months: 12 },
];

const PERIOD_ITEMS: Record<string, string> = {
  month: 'Questo Mese',
  '3months': 'Ultimi 3 Mesi',
  year: "Quest'Anno",
};

export default function BilancioPage() {
  const fiches            = useFichesStore((s) => s.fiches);
  const ficheServices     = useFicheServicesStore((s) => s.fiche_services);
  const services          = useServicesStore((s) => s.services);
  const earningsByMonth   = useStatsStore((s) => s.earningsByMonth);
  const earningsByDay     = useStatsStore((s) => s.earningsByDay);
  const earningsByWeek    = useStatsStore((s) => s.earningsByWeek);
  const prevPeriodEarnings = useStatsStore((s) => s.prevPeriodEarnings);
  const setTimeRange      = useStatsStore((s) => s.setTimeRange);
  const computeFromFiches = useStatsStore((s) => s.computeFromFiches);
  const timeRange         = useStatsStore((s) => s.timeRange);

  const [period, setPeriod] = useState<Period>('month');
  const [taxRate, setTaxRate] = useState(27);

  // Sync initial period with store (store defaults to 6 months, page starts at 1 month)
  useEffect(() => {
    setTimeRange(1);
  }, [setTimeRange]);

  const handlePeriodChange = (value: Period) => {
    const opt = PERIOD_OPTIONS.find((o) => o.value === value);
    if (!opt) return;
    setPeriod(value);
    setTimeRange(opt.months);
  };

  // Recompute earnings whenever source data or time window changes
  useEffect(() => {
    computeFromFiches(fiches, ficheServices, services);
  }, [fiches, ficheServices, services, timeRange, computeFromFiches]);

  const grossRevenue = useMemo(() => {
    if (period === 'month')   return earningsByDay.reduce((sum, d) => sum + d.earnings, 0);
    if (period === '3months') return earningsByWeek.reduce((sum, w) => sum + w.earnings, 0);
    return earningsByMonth.reduce((sum, m) => sum + m.earnings, 0);
  }, [period, earningsByDay, earningsByWeek, earningsByMonth]);
  const estimatedTax = useMemo(
    () => grossRevenue * (taxRate / 100),
    [grossRevenue, taxRate]
  );
  const netProfit = useMemo(
    () => grossRevenue - estimatedTax,
    [grossRevenue, estimatedTax]
  );

  // Trend vs previous period
  const trendPercent = useMemo(() => {
    if (prevPeriodEarnings <= 0) return null;
    return ((grossRevenue - prevPeriodEarnings) / prevPeriodEarnings) * 100;
  }, [grossRevenue, prevPeriodEarnings]);

  const trendLabel = useMemo(() => {
    if (trendPercent === null) return null;
    const sign = trendPercent >= 0 ? '+' : '';
    return `${sign}${trendPercent.toFixed(1)}%`;
  }, [trendPercent]);

  const trendUp = trendPercent !== null ? trendPercent >= 0 : undefined;

  // Chart data — granularity depends on selected period
  const chartData = useMemo(() => {
    if (period === 'month')   return earningsByDay;
    if (period === '3months') return earningsByWeek;
    return earningsByMonth.map((m) => ({ label: m.month, earnings: m.earnings }));
  }, [period, earningsByDay, earningsByWeek, earningsByMonth]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Bilancio"
        icon={Wallet}
        actions={
          <Select
            value={period}
            onValueChange={(v) => handlePeriodChange(v as Period)}
            items={PERIOD_ITEMS}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiCard
          label="Incassi Lordi"
          value={grossRevenue}
          icon={Wallet}
          trend={trendLabel}
          trendUp={trendUp}
        />
        <KpiCard
          label="Tasse Stimate"
          value={estimatedTax}
          dimmed
          icon={Landmark}
        />
        <KpiCard
          label="Utile Netto"
          value={netProfit}
          accent={netProfit >= 0 ? 'green' : 'red'}
          icon={TrendingUp}
        />
      </div>

      {/* Chart + Tax Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} isEmpty={grossRevenue === 0} />
        </div>
        <div className="lg:col-span-1">
          <TaxSimulatorCard
            gross={grossRevenue}
            taxRate={taxRate}
            onTaxRateChange={setTaxRate}
            tax={estimatedTax}
            net={netProfit}
          />
        </div>
      </div>
    </div>
  );
}
