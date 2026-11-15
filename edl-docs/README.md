# Lume component docs

Lume's component library in [edl docs](https://github.com/edl-studio/edl-docs),
EDL's Storybook replacement: every component in `src/lib/components/shared/ui`,
the charts and the table controls, rendered with the app's own CSS in light and
dark, with Controls, code and token pages.

## Run it

```bash
npm run docs:install   # once; needs `gh` logged in as al-edl (GitHub Packages)
npm run docs           # http://localhost:6061
```

`@edl-studio/docs` is a private package on GitHub Packages. It lives in this
folder with its own `package.json`, so the app's install and the Vercel build
never need the registry or a token. `.npmrc` reads the token from
`EDL_NPM_TOKEN`, which `docs:install` fills from `gh auth token`; no token is
written to disk.

## Add a story

Put `Foo.stories.tsx` next to `Foo.tsx` (CSF3, Storybook's format), with types
from `@docs/csf`. `Button.stories.tsx` is the reference. Titles use these
sections: `Azioni`, `Moduli`, `Liste`, `Sovrapposizioni`, `Feedback`,
`Navigazione`, `Layout`, `Dati`. Story copy is Italian salon content.

Check that every story renders, in both themes:

```bash
node edl-docs/scripts/check-stories.mjs [filter] [--dark] [--shots dir]
```

## What is here

| File | Does |
|---|---|
| `edl-docs.config.js` | White label (Lume logo, indigo accent, graphite shell), stories glob, token pages, Vite aliases |
| `preview.tsx`, `preview.css` | The app's `globals.css`, its providers, the light/dark switch |
| `preview-head.html` | Geist and Geist Mono (next/font in the app) |
| `mocks/` | Inert `next/link`, `next/navigation`, `next/image` and Supabase client |
| `csf.ts` | `Meta` and `StoryObj` types |
| `logo.svg` | The Lume wordmark as paths (Geist Semibold) |

`preview.tsx` hands edl docs the page background in sRGB: edl docs 0.2.0 reads
it as `rgb()` numbers, and Lume's `oklch()` background otherwise paints the
canvas rulers pure blue.
