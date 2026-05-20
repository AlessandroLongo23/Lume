# Tour anchors (`data-tour`)

NextStep targets elements by CSS selector. Tours use stable `data-tour` attributes so they don't break
when classes change.

## Naming convention

| Anchor | Goes on | Example |
|---|---|---|
| `nav-<route>` | sidebar nav link (already generated) | `nav-clienti`, `nav-fiches` |
| `<route>-page` | the page's root `<div>` — for whole-page narrate steps | `clienti-page` |
| `action-<entity>-create` | the header "Nuovo X" button | `action-client-create` |
| `field-<entity>-<field>` | a form field (a required text field also doubles as the step's `advanceWhenFilled` gate) | `field-client-first_name` |
| `<entity>-form` | the form's root `<div>` inside the modal — spotlight target for a "pick from a Select" step (the form's box covers the open dropdown) | `service-form` |
| `save-<entity>` | the modal's create/save submit button (via a prop — see below) | `save-client` |

`<entity>` is singular English (`client`, `service`, `operator`, `coupon`, `fiche`, `product`,
`abbonamento`). `<route>` matches the admin URL segment. Selectors in steps are the attribute form:
`selector: '[data-tour="action-client-create"]'`.

Two anchors don't follow "add the attribute to the element directly":
- **`save-<entity>`** lives in the SHARED `AddModal`, which already accepts a `confirmDataTour` prop —
  pass `confirmDataTour="save-<entity>"` from the entity's `Add*Modal`, don't hard-code it in `AddModal`.
- **A list search box** often can't take a prop (e.g. `Searchbar` doesn't forward `data-tour`) — just
  target it by a stable selector like `input[placeholder="Cerca cliente..."]`.

## Nav anchors already exist

The sidebar generates them in `src/app/admin/layout.tsx`:

```ts
items: group.routes.map((r) => ({ /* … */ dataTour: `nav-${r.url}` }))
```

…rendered by `Sidebar.tsx` as `data-tour={item.dataTour}`. So `[data-tour="nav-<route>"]` is available
for every sidebar entry — no work needed for navigation steps.

## Adding a new anchor

1. **Find the element.** Create buttons live in the page header and empty state of
   `src/app/admin/<route>/page.tsx`; fields and the save button live in
   `src/lib/components/admin/<entity>/Add*Modal.tsx` (or `*Modal.tsx`). Grep, e.g.:
   - `rg "Nuovo cliente" src/app/admin/clienti` (the create button label)
   - `rg "onClick=\\{\\(\\) => setShowAdd" src/app/admin` (modal-trigger pattern)
2. **Add the attribute only.** A minimal `Edit` adding `data-tour="…"` to the exact JSX element.
   Add the same `action-<entity>-create` value to BOTH the header button and the empty-state button so
   the step works regardless of whether the list is empty.
   ```tsx
   <Button data-tour="action-client-create" onClick={() => setShowAdd(true)}>Nuovo cliente</Button>
   ```
   For a plain `<input>`/`<textarea>`, put `data-tour` on the control itself. But components that DON'T
   spread props onto their rendered element — e.g. `NumberInput` and `Select` — silently drop a `data-tour`
   prop; anchoring them does nothing useful, and anchoring the inner `<input>` of a `NumberInput` spotlights
   only the text area (missing the steppers/suffix). For those, anchor the field's **column wrapper** (the
   `<div>` holding the label + control) so the spotlight covers the whole control. CAVEAT: a step that uses
   `advanceWhenFilled` must resolve to the real `<input>` (TourCard polls its `.value`); a wrapper has no
   value. So `advanceWhenFilled` is only for plain inputs you can anchor directly — Select fields and
   optional fields don't use it (see `reference/dependency-map.md`).
3. **Never restructure.** Attribute additions only. If a component spreads `...rest` onto its root you
   can pass `data-tour` as a prop; otherwise add it to the rendered element directly.
4. **Record `file:line`** for every anchor added and report it at the end of the run.

## Advancing each step

A step advances by exactly one of (see `reference/dependency-map.md` for the full pattern):

- **Navigation** → `advanceOnRoute:'/admin/<route>'` (TourBridge watches the path). No code.
- **Fill a field** → `advanceWhenFilled:'[data-tour="field-<entity>-<field>"]'`. No code: TourCard polls
  that input and enables "Avanti" once it has a value. Use this for every required field AND the search
  box. (Don't emit events for fields, don't auto-advance on content.)
- **Modal/list event** (open, created) → `completeOn:'<entity>:<event>'` + a one-line emit:
  ```ts
  import { emitTourEvent } from '@/lib/tutorials/tourEvents';
  ```
  - `<entity>:created` — after a successful insert (store action or modal submit).
  - `<entity>:modal-open` — from the modal's **`onEnterComplete`** prop (the `Modal`→`AddModal`
    callback), NOT on the `isOpen` flag. Emitting on `isOpen` advances mid-entrance-animation, so the
    next step's coachmark measures the field while it's still flying in and lands in the wrong place.
  Emitting with no tour running is a harmless no-op, so these are safe to leave in place.

## Verify anchors after placing them

In Step 4 (screenshots), while on the relevant screen, assert each anchor resolves:

```js
// browser_evaluate
document.querySelector('[data-tour="action-client-create"]') !== null
```

If an anchor is missing at runtime, fix the placement before finishing.
