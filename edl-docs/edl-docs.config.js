import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from '@edl-studio/docs';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../src');
const mock = (file) => path.resolve(here, 'mocks', file);

// edl-docs watches its own folder for new story files; the stories live in
// ../src, so watch that too (Vite only reports adds for watched paths).
const watchSrc = {
  name: 'lume-watch-src',
  configureServer(server) {
    server.watcher.add(src);
  },
};

export default defineConfig({
  // Lume is the client, so the header shows its logo alone.
  brand: {
    name: 'Lume',
    logo: 'logo.svg',
    logoHeight: 20,
    // --color-brand-primary-500 on light, -400 on dark (DESIGN.md "Lamplight Indigo").
    accent: { light: '#6366F1', dark: '#818CF8' },
    // Graphite: the app's dark --lume-bg, oklch(0.148 0.007 265).
    background: '#0B0C10',
  },
  port: 6061,
  renderer: 'react',
  stories: ['../src/**/*.stories.tsx'],
  docs: ['docs/**/*.mdx'],
  preview: 'preview.tsx',
  previewHead: 'preview-head.html',
  globals: {
    theme: { label: 'Tema', options: [{ value: 'light', label: 'Chiaro' }, { value: 'dark', label: 'Scuro' }], default: 'light' },
  },
  tokens: {
    prefix: '--lume-',
    sources: ['../src/styles/tokens/*.css', '../src/styles/components.css'],
    exclude: [
      '--tw-',
      // Tailwind's stock palettes that a utility happens to emit; not Lume's.
      '--color-amber', '--color-green', '--color-emerald', '--color-rose',
      // The shadcn bridge in globals.css, kept only for src/components/ui
      // until those move to --lume-* (DESIGN.md, Phase C).
      '--background', '--foreground', '--card', '--popover', '--primary', '--secondary', '--muted',
      '--accent', '--destructive', '--input', '--border', '--ring', '--chart', '--sidebar', '--radius',
      '--success', '--warning',
    ],
  },
  sort: {
    order: ['Introduzione', 'Tokens', 'Azioni', 'Moduli', 'Liste', 'Sovrapposizioni', 'Feedback', 'Navigazione', 'Layout', 'Dati'],
  },
  vite: {
    plugins: [tailwindcss(), watchSrc],
    // edl-docs 0.3.0 serves its shell from source and keeps itself out of
    // pre-bundling, so the shell's Base UI reaches the browser unbundled and
    // imports this CommonJS shim raw (blank shell). Pre-bundle the shim.
    optimizeDeps: {
      include: ['use-sync-external-store/shim', 'use-sync-external-store/shim/with-selector'],
    },
    resolve: {
      alias: [
        // Next.js modules have no meaning outside the app: inert stand-ins.
        { find: /^next\/link$/, replacement: mock('next-link.tsx') },
        { find: /^next\/navigation$/, replacement: mock('next-navigation.ts') },
        { find: /^next\/image$/, replacement: mock('next-image.tsx') },
        // No network from the canvas: stores get a client that never connects.
        { find: /^@\/lib\/supabase\/client$/, replacement: mock('supabase-client.ts') },
        { find: /^@docs\//, replacement: `${here}/` },
        { find: /^@\//, replacement: `${src}/` },
      ],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify('http://localhost:54321'),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify('docs'),
      'process.env.NEXT_PUBLIC_SITE_URL': JSON.stringify('http://localhost:3000'),
    },
  },
});
