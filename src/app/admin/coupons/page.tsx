'use client';

import { TrafficCone } from 'lucide-react';

export default function CouponsPage() {
  return (
    <div className="flex flex-col items-center justify-center translate-y-1/2">
      <TrafficCone strokeWidth={0.5} className="size-24" />
      <span className="text-center text-2xl font-bold">Coupons in arrivo...</span>
    </div>
  );
}
