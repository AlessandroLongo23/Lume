# Dependency map & canonical step pattern

How to figure out a topic's **prerequisites** (so the tour chains correctly) and how to **shape the
tour steps** consistently. Verify exact required fields against the type models in `src/lib/types/`
before generating — this map is the guide, the types are the truth.

## Entity → prerequisite graph

Each row: to perform the action, this data must already exist. The `predicate` is the thunk from
`src/lib/tutorials/prerequisites.ts`; the `prereq tutorial` is the `tutorialId` to chain.

| Action / tutorial | Requires | predicate(s) | chained tutorialId(s) |
|---|---|---|---|
| Create a **client** | — | — | — |
| Create a **service** | (a service category is selected in-form; create one inline if none) | — | — |
| Create an **operator** | — | — | — |
| Create a **product** | category / manufacturer / supplier (selected in-form) | — | — |
| Create a **coupon / discount** | a recipient **client**; for `free_item` also a **service**/**product** | `hasClients` (+ `hasServices`/`hasProducts`) | `crea-cliente` (+ `crea-servizio`) |
| Create a **fiche** (appointment) | a **client**, a **service**, an **operator** | `hasClients`, `hasServices`, `hasOperators` | `crea-cliente`, `crea-servizio`, `crea-operatore` |
| **Apply a discount** to a fiche | a **coupon** and a **fiche** (which transitively need client/service/operator) | `hasCoupons`, `hasFiches` | `crea-coupon`, `crea-fiche` |
| Create an **abbonamento** | a **client**; usually a **service** | `hasClients` (+ `hasServices`) | `crea-cliente` (+ `crea-servizio`) |

### Proof points (from the type models)

- `Coupon` (`src/lib/types/Coupon.ts`): `recipient_client_id` is **mandatory** → needs a client.
  `discount_type === 'free_item'` also needs `free_item_kind` + `free_item_id` → a service or product.
- Fiche service lines (`FicheServiceDraft` in `src/lib/types/FicheDraft.ts`): require `service_id`
  **and** `operator_id`. A fiche needs a `client_id`.
- Applying a coupon to a fiche: `useCouponsStore.applyCoupon(couponId, ficheId, amount)` — both a
  coupon and a fiche must exist.

The resolver (`resolveTutorialChain`) walks these depth-first and prunes anything already `met()`, so
declaring the *direct* prerequisites is enough — transitive ones resolve themselves (apply-discount →
crea-coupon → crea-cliente).

## Declaring prerequisites in the registry

```ts
import { hasClients, hasCoupons, hasFiches } from './prerequisites';
// …
{
  id: 'applica-sconto',
  // …
  prerequisites: [
    { label: 'almeno un coupon', met: hasCoupons, tutorialId: 'crea-coupon' },
    { label: 'almeno una fiche', met: hasFiches, tutorialId: 'crea-fiche' },
  ],
}
```

Use plain-Italian `label`s ("almeno un cliente") — they appear in the preflight ("Per questa guida
prepariamo prima: …").

## Canonical step pattern (per tour)

Each tutorial is its OWN tour; the chain runs them in order. Author every "create X" tour the same way.
**Interaction is LOCKED to the spotlighted element** — `clickThroughOverlay` is OFF in
[admin/layout.tsx](src/app/admin/layout.tsx) and must stay off (the owner wants the user unable to click
anything but the highlight). So design every step so the only things the user needs are the highlighted
element and the TourCard's own buttons (the card renders above the overlay, always clickable).

### The advance mechanisms (`LumeTourStep`, handled by TourCard + TourBridge)

- `advanceOnRoute:'/admin/<route>'` — a navigation action; advances when the app reaches that route.
- `completeOn:'<event>'` — advances on a `tourEvents` event (modal open, row created). "Avanti" stays
  disabled — the action drives the advance.
- `advanceWhenFilled:'<input CSS selector>'` — a "fill a field" step: TourCard keeps "Avanti" DISABLED
  while that input is empty and ENABLES it once it has a value, so the user finishes typing and clicks
  Avanti. (TourCard **polls** the selector each frame — robust to inputs that swap their DOM node, like a
  list search box. Do NOT use blur/keystroke events: blur needs a click the locked overlay forbids, and
  keystroke advances on the first character, jumping mid-typing.)
- `optional:true` — for an OPTIONAL field (price, costo, note, descrizione…). "Avanti" stays ENABLED (no
  gate); TourCard also renders a quiet "Salta" button beside it and a "Facoltativo" badge by the title —
  both "Avanti" and "Salta" advance, so the user edits the field or moves on. Use this (NOT
  `advanceWhenFilled`) for any field that is not required to save. Gating an optional field with
  `advanceWhenFilled` traps a user who leaves it blank — they can never advance.
- plain `narrate` — "Avanti" always enabled (explanation steps).

### The verified create-flow shape (built & runtime-tested for `crea-cliente`)

1. **ACTION — open the page.** selector `[data-tour="nav-<route>"]`, `advanceOnRoute:'/admin/<route>'`,
   `side:'right'`. **No `startRoute`** — step 0 IS the nav action; a `startRoute` would pre-navigate and
   skip it.
2. **NARRATE — introduce the page.** Spotlight the WHOLE page: `selector:'[data-tour="<route>-page"]'`
   (a `data-tour` on the page's root `<div>`) and **OMIT `side`** so the card renders fixed-centered.
   With a `side`, NextStep tries to place the card beside the spotlight and its clamp only flips once, so
   a target taller than the viewport pushes the card off-screen.
3. **ACTION — open the create modal.** selector `[data-tour="action-<entity>-create"]`,
   `completeOn:'<entity>:modal-open'`. Emit that event from the modal's **`onEnterComplete`** (the
   `Modal`→`AddModal` callback), NOT on the `isOpen` flag, so the next step measures the SETTLED modal
   rather than mid-entrance-animation.
4. **ACTION — one step PER required field.** selector AND `advanceWhenFilled` both
   `[data-tour="field-<entity>-<field>"]` (one step for nome, one for cognome, …). This is what
   guarantees the required fields are filled before save — otherwise submit validation blocks,
   `<entity>:created` never fires, and the tour stalls on "Salva". Don't gate on "all fields at once"
   (typing one field gives no feedback) and don't auto-advance on content. Two field-shapes break this
   default — handle them as below:
   - **Required field rendered as a `Select`** (Lume's custom combobox, NOT a native `<select>`):
     `advanceWhenFilled` CANNOT gate it — a `<div role="combobox">` has no input value to poll — AND its
     dropdown opens in a portal at `z-popover` (86), *below* the tour overlay (~998), so it is only
     visible/clickable INSIDE the spotlight hole. Verified fix (see `crea-servizio`'s categoria step):
     spotlight the WHOLE FORM (`selector:'[data-tour="<entity>-form"]'`, `side:'right'` so the card clears
     it) — the form's box contains the dropdown (which opens just below the trigger), so the hole exposes
     it — and advance with `completeOn:'<entity>:<field>-selected'`, emitted from the modal's `onChange`
     when that field changes (one line, no-op without a tour). Confirm at runtime with
     `document.elementFromPoint(centerOfAnOption)` → it must return the option, not the overlay. Do NOT
     try to raise the Select's z-index: NextStep's click-blocking rects surround the hole, so a portal
     outside the hole stays blocked regardless of z-index, and editing the shared `Select` is off-limits.
   - **Optional fields** (price, costo, note, descrizione…): give each meaningful one its own step with
     `mode:'action'` + `optional:true` (NO `advanceWhenFilled`/`completeOn`). The user edits it or clicks
     "Salta". A thorough tour covers ALL the form's meaningful fields, not just the required ones — but
     mark the non-required ones `optional` so they never trap the user.
5. **ACTION — save.** selector `[data-tour="save-<entity>"]`, `completeOn:'<entity>:created'`.
6. **ACTION — find the new row.** selector AND `advanceWhenFilled` = the list's search box (e.g.
   `input[placeholder="Cerca cliente..."]` when the search component doesn't forward a `data-tour`).
   Mirror what the article screenshots show.
7. **NARRATE — wrap up over the whole page.** Same `[data-tour="<route>-page"]` anchor as step 2, OMIT
   `side`. Last step → `endRoute:'/admin/aiuto/<slug>'` returns to the help page.

Notes:
- For a pure "tour of a page" (no creation), use mostly `narrate` steps anchored to real elements.
- Coachmark robustness is already handled globally: `TourBridge` runs a change-gated rAF "follow loop"
  so the spotlight tracks elements that move (animations, scroll, reflow). You don't add anything per
  tour for that — just use `onEnterComplete` for the modal-open step (above).
- ALWAYS run the tour to verify (skill Step 4): every `data-tour` resolves at runtime, each whole-page
  card is fully inside the viewport, and each `advanceWhenFilled` step toggles "Avanti" disabled→enabled.
