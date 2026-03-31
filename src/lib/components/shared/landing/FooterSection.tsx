export function FooterSection() {
  return (
    <footer className="bg-white border-t border-[#E4E4E7] py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-lg font-semibold text-[#09090B]">Lume</span>
          <p className="text-xs text-zinc-400 mt-1">Il gestionale che illumina il tuo salone.</p>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            Privacy
          </a>
          <a href="#" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            Termini
          </a>
          <a
            href="mailto:info@lumeapp.it"
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Contatti
          </a>
        </div>

        <p className="text-xs text-zinc-400">© 2025 Lume</p>
      </div>
    </footer>
  );
}
