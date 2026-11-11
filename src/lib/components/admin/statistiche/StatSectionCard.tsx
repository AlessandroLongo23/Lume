interface StatSectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StatSectionCard({ title, subtitle, children }: StatSectionCardProps) {
  return (
    <section className="min-w-0 surface-card overflow-hidden">
      <div className="px-5 pt-5 pb-4 min-w-0">
        <h3 className="text-base font-medium tracking-tight text-[var(--lume-text)]">{title}</h3>
        {subtitle && <p className="text-sm text-[var(--lume-text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
