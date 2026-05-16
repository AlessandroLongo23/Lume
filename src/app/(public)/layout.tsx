import type { ReactNode } from 'react';

// Root of the public-facing surface (currently: per-salon online booking).
// Intentionally minimal — no admin sidebar/header. Per-slug branding is
// injected one level deeper in `[slug]/layout.tsx`.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[var(--lume-bg)] text-[var(--lume-text)]">{children}</div>;
}
