export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold tracking-tight text-zinc-900">
            lume<span className="text-indigo-600">.</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          {children}
        </div>

        {/* Footer attribution */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          © {new Date().getFullYear()} Lume — Tutti i diritti riservati
        </p>
      </div>
    </div>
  );
}
