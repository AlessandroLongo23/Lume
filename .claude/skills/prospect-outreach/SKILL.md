---
name: prospect-outreach
description: Use when the user wants to build a prospect list of Italian salons or generate a cold-call/cold-email template for Lume sales outreach. Triggers on phrases like "find prospects in Milano", "build a salon list for Bologna", "draft a cold call script", "give me an outreach template", "trova clienti potenziali", "lista saloni a [città]". Outputs a list of candidate salons with contact info plus a localized Italian cold-call template with variable slots ready to personalize.
argument-hint: [city-or-region] [hair|barber]
allowed-tools: WebFetch, WebSearch, Read, Write, Bash(mkdir *), Bash(date *)
---

# Prospect outreach

Build a list of candidate salon clients for Lume in a given Italian area, score them by fit, and produce a cold-call template in Italian.

## Lume positioning constants (used in the cold-call template)

- **Pricing:** €49/mese, €490/anno (2 mesi gratis).
- **Pitch in one line:** "Lume è il software gestionale per saloni: agenda, fiches clienti, ordini — a €49 al mese, contro i €60 del software che molti saloni usano oggi, con un'interfaccia molto più semplice."
- **Tone:** formal "Lei", professional, concise. No salesy hype. We're underpricing the incumbent and competing on UX.

If pricing changes, update here and in [CLAUDE.md](../../../CLAUDE.md) "Product" section together.

## Workflow

### 1. Parse arguments

- `$0` = area (e.g., `Milano`, `Bologna`, `Emilia-Romagna`). If missing, ask the user.
- `$1` = optional vertical filter: `hair` (parrucchieri), `barber` (barbieri). If missing, default to "both" and segment in the output.
- Compute report date: `!`date +%Y-%m-%d``.

### 2. Build candidate list (15–25 salons)

Use **WebSearch** in parallel for queries like:

- `"parrucchieri <area>"`
- `"saloni di bellezza <area>"`
- `"barber shop <area>"` (if `$1` includes barber)
- `"miglior parrucchiere <area>"` — surfaces well-reviewed independents

Aim for diverse sources: Google Maps listings, PagineGialle, Treatwell directories, salon-aggregator sites.

For each candidate, extract from search results / linked listing pages:

- Name
- Address
- Phone
- Website (if any)
- Instagram handle (if any)
- Apparent size: solo / 1–3 chairs / 4+ chairs / chain — inferred from photos, team page, or listing description
- Reviews: count + average if visible

If a candidate has no contact channel (no phone, no site, no IG), drop it.

### 3. Enrich each candidate

For salons that have a website or Instagram, **WebFetch** the bio / homepage / contact page. Look for:

- **Online booking:** Do they accept bookings online? Via what tool? (Treatwell, Booksy, Fresha, an embedded widget, "chiama per prenotare", or just WhatsApp.)
- **Visible competitor branding:** "Powered by X" badges, mentions of specific software in About / Privacy.
- **Visual quality:** modern site / Instagram-only / clearly outdated / no online presence at all.
- **Recent activity:** when was the last IG post? (active social = more reachable).
- **Owner name:** if listed on the site or "About" / "Chi siamo".

Skip enrichment for chains (e.g., Toni&Guy locations) — they're not the target segment.

### 4. Score fit (1–5)

Encode the score with these heuristics. Higher = better fit for Lume.

| Signal | Direction |
|---|---|
| Independent, 1–5 chairs | + |
| Chain (5+ locations) | strong − (likely not the buyer) |
| No online booking, or only WhatsApp / phone | + (clear pain) |
| Already on Treatwell/Booksy/Fresha | neutral (booking solved, but management probably not) |
| Mentions a specific Italian gestionale incumbent | strong + (direct switch candidate) |
| Active Instagram (posted in last 30 days) | + (reachable, modern-leaning) |
| Premium / luxury positioning | − (different segment, more conservative) |
| No phone reachable in public listings | strong − (drop) |
| Just opened (< 6 months) | − (often busy, not yet ready to switch tooling) |

Map the net signal to 1–5:
- **5** — independent, no/weak booking tool, on the incumbent or none, active social, owner name found.
- **4** — independent, some friction in current workflow, reachable.
- **3** — independent, OK current setup, reachable.
- **2** — chain or premium-luxury or limited reachability.
- **1** — chain with global software contracts, or unreachable.

### 5. Generate Italian cold-call template

Path: `output/marketing/prospects/cold-call-template-it.md`.

Only write this file if it doesn't exist yet — don't overwrite unless the user passes `--refresh` or explicitly asks.

Use this Italian B2B cold-call structure (formal "Lei"):

```markdown
# Template chiamata a freddo — Lume

> Variabili da sostituire prima di ogni chiamata:
> - `{{nome_titolare}}` — nome del titolare se conosciuto, altrimenti "il titolare"
> - `{{nome_salone}}` — nome del salone
> - `{{citta}}` — città del salone
> - `{{variabile_pain}}` — un dettaglio specifico osservato (es. "non avete ancora la prenotazione online", "vedo che usate ancora l'agenda cartacea")
> - `{{concorrente_attuale}}` — gestionale attualmente in uso, se identificato (altrimenti omettere il paragone diretto)

---

## Apertura
"Buongiorno, parlo con {{nome_titolare}} di {{nome_salone}}? Sono <Nome> di Lume."

## Permesso
"Le rubo trenta secondi e poi è libero/a di dirmi se vuole che richiami in un altro momento."

## Motivo (specifico, basato sulla ricerca)
"Le chiamo perché ho dato un'occhiata al vostro salone — {{variabile_pain}} — e proprio su questo Lume aiuta tanti parrucchieri a {{citta}}."

## Valore (una frase)
"Lume è il software gestionale per saloni: agenda, fiches clienti, ordini, in un'interfaccia molto più semplice di {{concorrente_attuale}}, e a €49 al mese contro i €60 che pagano oggi i saloni che usano gli strumenti vecchi."

## Aggancio
"Le va se Le mostro com'è in un paio di minuti? Posso anche mandarLe il link e Lei lo guarda con calma."

## Chiusura
- Se interesse: proporre demo concreta — "Le va bene martedì alle 10:30, oppure preferisce nel pomeriggio?"
- Se rinvio: "Quando Le farebbe comodo che La richiami? Mattina o pomeriggio?"
- Se no: "Capisco, grazie del tempo. Buona giornata."

---

## Note

- Mai più di 90 secondi prima di una domanda. Se parla solo Lume per due minuti, è già un no.
- Se il salone è già sul gestionale incumbent, NON aggredirlo — chiedere "cosa Le piace" e "cosa cambierebbe", e lasciare che il prezzo e l'UX parlino.
- Mai promettere funzionalità non ancora rilasciate.
```

### 6. Write the prospect list

Path: `output/marketing/prospects/<area>-YYYY-MM-DD.md`. Slugify the area: lowercase, hyphens, ASCII (`Emilia-Romagna` → `emilia-romagna`).

Template:

```markdown
# Prospetti Lume — <Area>

**Data ricerca:** YYYY-MM-DD
**Filtro:** hair | barber | both
**Totale candidati:** N

## Top tier (score 4–5) — chiamare per primi

| Score | Salone | Indirizzo | Telefono | Web | IG | Owner | Tooling attuale | Pain osservato | Note |
|---|---|---|---|---|---|---|---|---|---|
| 5 | <name> | <addr> | <tel> | <url> | @<handle> | <name> | <tool / "nessuno"> | <one line> | <one line> |
...

## Mid tier (score 3) — secondo round

(stesso formato)

## Low tier (score 1–2) — eventualmente

(stesso formato)

## Esclusi

- <name> — motivo (es. "catena globale", "nessun contatto pubblico", "appena aperto")

## Variabili pre-compilate per il template

Per ogni salone in top tier, suggerire `{{variabile_pain}}` da usare nella chiamata. Esempio:

- **<name salone>:** "ho visto che le prenotazioni si fanno solo via WhatsApp"
- **<name salone>:** "ho notato che il sito è solo una pagina Instagram"
```

## Edge cases & guardrails

- **No website / no IG:** still include if phone is public and the listing is recent. Note "phone-only outreach".
- **Chain salons:** mark explicitly under "Esclusi" with reason "catena globale" — they buy software at HQ, not at the chair.
- **Privacy:** use only **publicly listed** phone numbers (Google Maps, PagineGialle, salon's own website). Never scrape personal numbers from review profiles or social DMs. Never include email addresses unless the salon publishes a generic info@ on their site — no personal emails.
- **Geographic accuracy:** if the user gave a region (`Emilia-Romagna`), spread the list across the major cities; don't dump all 25 from Bologna.
- **Italian-only:** every customer-facing string in the template and pain notes must be in Italian. Internal notes in the report can stay in English.
- **No marketing fabrication:** "ho visto che..." must reference something actually observed during enrichment. If unverified, write `{{variabile_pain}}` as a TODO and let the user fill it.

## What this skill does NOT do

- Send emails or place calls. It produces a list and a script — execution is on the user.
- Buy paid lead-gen data (ZoomInfo, Apollo). Public sources only.
- Generate full email sequences or LinkedIn DMs (different skill territory; could be a future `/email-sequence` skill).
- Estimate TAM or run a market sizing study.

## Output location

```
output/marketing/prospects/
  <area>-YYYY-MM-DD.md          # the prospect list
  cold-call-template-it.md       # the reusable Italian template (one-time)
```
