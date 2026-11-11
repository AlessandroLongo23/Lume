# Lume UI components

Screens are built from these components. Before writing a styled `<input>`, a
popover, a list of rows, a tab bar or a card by hand, find it here. If nothing
fits, extend the closest component (a prop, a variant) instead of copying its
classes into a feature file. Visual rules live in [DESIGN.md](../../../../../DESIGN.md);
this file says which piece implements them.

Three layers, each built only from the one below:

1. **Tokens**: [`src/styles/tokens/`](../../../../styles/tokens/), the `--lume-*` variables.
2. **Recipes**: [`src/styles/components.css`](../../../../styles/components.css), Tailwind utilities that
   encode a look once: `control`, `control-sm|md|lg`, `surface-card`,
   `surface-float`, `selected`, `marker-current`, `list-row`, `list-row-danger`,
   plus `edge` and `hover-glide` in globals.css.
3. **Components**: this folder. Feature code composes components; it reaches for a
   bare recipe only where no component fits (and says why in a comment).

## Which component for which job

| Job | Use | Not |
|---|---|---|
| A button, icon button, link styled as a button | `Button` (`asChild` for links) | a styled `<button>` |
| A delete action | `Button variant="ghost-destructive"` opens the confirmation; only the confirming button inside it is `destructive` | a red button that opens a modal |
| Full-width, touch-sized or muted icon buttons | `Button className="w-full"`; `md` is already 44px on touch and icon-only ghost already rests muted | `pointer-coarse:h-11`, `text-[var(--lume-text-muted)]` overrides |
| Single-line text field (with `prefix` / `suffix` text inside the box) | `forms/FormInput` | `<input className="…">` |
| Multi-line text | `forms/TextArea` | `<textarea className="…">` |
| Label + control + hint + error around any custom control | `forms/Field` | a hand-made label stack |
| Pick one value from a list (searchable or not), incl. custom rows | `forms/Select` (`renderOption`, `renderValue`) | a new dropdown |
| Phone number with prefix | `forms/PhoneNumber` (prefix alone: `PhonePrefixSelect`) | |
| Choose several items from a list | `forms/MultiSelectList` | checkbox lists by hand |
| Identity colour (client, category) | `forms/ColorSwatchPicker` | swatch grids by hand |
| Date + time | `forms/DateTimeField` | `type="datetime-local"` (shows mm/dd/yyyy) |
| A month calendar (inline or in a popover) | `forms/CalendarPanel` | a new day grid |
| Date / number / comune | `forms/DateField`, `forms/NumberInput`, `ComuneAutocomplete` | |
| Choose between 2–4 options inline | `ToggleButton` (segmented) or `forms/OptionGroup` (cards with icon + hint) | buttons with a selected class |
| A setting that is on/off, with title and description | `forms/SwitchRow` | a flex row with a `Switch` |
| A checkbox with its text (a title and description, or a statement with links such as an acceptance) | `forms/CheckboxRow` | a `<label>` around a `Checkbox` |
| Bare on/off | `Switch`; multiple choice `forms/Checkbox` | `type="checkbox"` |
| Page-level sections (a count per tab: `TabButton count`) | `Tabs` → `TabBar` + `TabButton` | `border-b-2` buttons |
| Side navigation inside a page (settings, statistics) | `nav/SectionNav` | |
| "⋯" actions menu | `DropdownMenu` | |
| Any other menu, option list, picker list, suggestions | `list/ListBox` + `ListRow` (+ `ListGroupLabel`, `ListSeparator`, `ListEmpty`) | rows with `hover:bg-…` |
| Anything floating over the page | `FloatingPanel` inside `<Portal>` + `AnimatePresence`, positioned with `useAnchoredPopover` | `fixed … shadow-lg border` |
| Arrow-key navigation in a list | `useListNavigation` | a hand-written `switch (e.key)` |
| Dialog | `modals/Modal` + `modals/dialogParts` (`DialogHeader`, `DialogFooter`), or `ConfirmDialog` (yes/no, optional third `alternative`) / `AddModal` (create and edit forms) | a custom overlay |
| Delete confirmation (incl. type-to-confirm + "Archivia" alternative) | `modals/DeleteModal` (`warning`, `tip`, `confirmPhrase`, `alternative`); bulk delete of a table: `DeleteAllModal` | a hand-built delete dialog |
| Inline notice (info / success / warning / danger) | `Callout` | a tinted box with an icon |
| Inline link in text | `TextLink` (an action that reads as a link: `TextButton`) | `underline …` classes |
| Small neutral label ("Test", "Tuo") | `Tag`; beside a detail-page title `detail/DetailChip` | a tinted pill by hand |
| A toggle button (active filter, view switch) | `Button pressed` | a button with a selected class |
| Side sheet | `SidePanel` | |
| Tooltip | `Tooltip` | `title=""` for UI hints |
| Status (paid, pending, low stock…) | `StatusDot` (dot + word); its `StatusTone` names every tone in the library | tinted pills, colour-named tones |
| Counts | `NumberBadge` (in a tab: `TabButton count`) | |
| Keyboard shortcut chip | `Kbd` | |
| Big numbers with labels | `StatRow` + `Stat`; one figure of an entity on a detail page `detail/StatTile` | KPI cards with corner icons |
| Data table look | `table/tableStyles` (+ admin/table `Pagination`, `FacetedFilter`, `ColumnPicker`) | |
| Page title (with `back` link and `meta` slot) | `PageHeader` | an `<h1>` with classes |
| Empty list / first use | `EmptyState` | |
| Search box | `Searchbar` | an `<input>` with a search icon |
| A card | `surface-card` recipe (clickable: add `card-interactive`) | `border shadow-sm` |

## Rules every component follows

- **Edges are inset** (`inset 0 0 0 1px`), never an outer ring or a CSS border:
  an outer ring is clipped by any scrolling parent (modal bodies).
- **One selected look**: `selected` (neutral `--lume-active` fill, full text,
  weight 500), in nav, tabs, segments, list rows, date cells and chips.
  `marker-current` marks "today/current" without selecting it. Checkboxes and
  switches fill with the text colour. Indigo is for actions and focus only.
- **One hover in lists**: the hover glide (`useHoverGlide`), built into
  `ListBox`, `TabBar`, `ToggleButton` and the sidebar. Rows never paint their
  own hover background.
- **One floating surface and motion**: `FloatingPanel` (`surface-float`, fade +
  4px drift, reduced motion fades only).
- **Heights**: 36px controls (`control-md`), 44px on touch, 32px `sm` for dense
  table filters, 44px `lg` only outside the admin app.
