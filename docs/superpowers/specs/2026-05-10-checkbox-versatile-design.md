# Checkbox Component — Versatile Redesign

**Goal:** Extend `Checkbox` to support standard HTML checkbox semantics (`indeterminate`, `defaultChecked`, `forwardRef`, `data-*`, `onClick`, etc.) while keeping the existing visual style and adding a `sm` size variant for table/inline contexts.

---

## Motivation

Two remaining raw `<input type="checkbox">` elements couldn't be replaced during the `Custom*` rename because:
1. `ProductsTab.tsx` — TanStack Table row-selection checkboxes require `indeterminate` DOM state and ref forwarding.
2. `CookieConsentBanner.tsx` — Uses `defaultChecked` (uncontrolled) and `name` for form semantics.

The fix is to make `Checkbox` a proper `forwardRef` component backed by a real `<input>`.

---

## API

```ts
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;          // optional text label above the box
  size?: 'sm' | 'md';     // 'md' default
  indeterminate?: boolean; // shows Minus icon + syncs DOM .indeterminate
  className?: string;      // applied to outer wrapper div
}
```

`forwardRef<HTMLInputElement, CheckboxProps>` — ref points to the hidden native input.

All standard `InputHTMLAttributes` (`name`, `defaultChecked`, `onChange`, `onClick`, `disabled`, `aria-*`, `data-*`) pass through to the native input without special handling.

---

## Visual Sizes

| Size | Box | Icon |
|------|-----|------|
| `md` | `h-10 w-10` (40px) | `size-4` (16px) |
| `sm` | `h-5 w-5` (20px) | `size-2.5` (10px) |

Both sizes share identical styling: `border-zinc-500/25`, `rounded-lg`, `bg-white dark:bg-zinc-800` unchecked; `border-primary/50 bg-primary/10` checked. Indeterminate shows a Lucide `Minus` icon (same `text-primary` color) instead of `Check`.

---

## Internal Structure

```
<div className={className}>
  {label && <label htmlFor={id}>{label}</label>}
  <label htmlFor={id}>
    <input
      ref={mergedRef}        // forwarded ref OR internal ref for indeterminate sync
      id={id}
      type="checkbox"
      className="sr-only"
      {...rest}              // name, checked, defaultChecked, onChange, onClick, data-*, aria-*, disabled…
    />
    <div aria-hidden>
      {isChecked && <Check />}
      {indeterminate && <Minus />}
    </div>
  </label>
</div>
```

- `useId()` generates the `id` tying both labels to the input.
- The visual `div` is `aria-hidden` — all accessibility meaning lives on the native input.
- The text `<label htmlFor={id}>` and visual `<label htmlFor={id}>` both toggle the input on click.

### Controlled vs uncontrolled

- **Controlled** (`checked` prop present): `checked` drives both the native input and the visual directly.
- **Uncontrolled** (`defaultChecked`, no `checked`): internal `useState(defaultChecked ?? false)` mirrors the input's state via `onChange` so the visual stays in sync. The internal `onChange` handler calls `setInternalChecked` first, then forwards to the consumer's `onChange` if provided.

### Indeterminate sync

```ts
useEffect(() => {
  if (internalRef.current) {
    internalRef.current.indeterminate = !!indeterminate;
  }
}, [indeterminate]);
```

`internalRef` is always kept; the forwarded ref (if any) is merged with it via a ref-merge utility so both point to the same input element.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/components/shared/ui/forms/Checkbox.tsx` | Full rewrite |
| `src/lib/components/admin/magazzino/ProductsTab.tsx` | Replace 2 raw `<input type="checkbox">` with `<Checkbox size="sm">` |
| `src/lib/components/shared/cookieConsent/CookieConsentBanner.tsx` | Replace raw `<input type="checkbox">` with `<Checkbox size="sm">` |

Existing consumers (`ClientForm`, `GiftCardModal`, `ChoicesFilter`, `ConfirmAppointmentChangeModal`) require no changes — the new API is backward-compatible.

---

## Verification

1. `npm run check` — zero errors.
2. Visually confirm in the browser:
   - Form checkbox (md): checked/unchecked toggle works, label click works.
   - Table checkboxes (sm): appear on row hover, select-all shows indeterminate dash when some rows selected, checks all when none selected.
   - Cookie banner checkbox (sm): renders checked/unchecked correctly on page load.
