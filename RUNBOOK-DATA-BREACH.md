# Data breach runbook

When a personal-data breach is detected (or strongly suspected) on Lume's
infrastructure, follow this runbook. The goal is to honour two hard deadlines:

- **≤24h** — notify each affected salon (Titolare). Promised in the DPA, §9.
- **≤72h** — the salon must in turn notify its supervisory authority
  (Garante for IT residents, Datatilsynet for DK). Lume's own notification
  to Datatilsynet (lead authority for our establishment) under Art. 33 GDPR
  is also due within 72h of becoming aware.

## 0. Trigger

A breach event is anything that compromises **confidentiality, integrity, or
availability** of personal data:

- unauthorised access to the production database or any sub-processor
- accidental data leak (misconfigured bucket, stale RLS, cross-tenant query
  that returned wrong rows)
- ransomware / data destruction
- credentials theft (Vercel, Supabase, Resend, Anthropic, Stripe — any
  privileged token used by Lume)
- prolonged outage that prevents data subjects from exercising their rights

If you are unsure whether something is a breach, **treat it as one** until
the investigation rules it out.

## 1. Contain (first 4 hours)

1. Identify the affected systems and stop the bleeding: revoke compromised
   credentials, block the malicious IP, take the affected service offline
   if continued operation worsens exposure.
2. Snapshot evidence: full timestamps (UTC), affected user/salon IDs,
   queries logged, traffic samples. Save under
   `internal/incidents/YYYY-MM-DD-<short-name>/` (do not commit publicly).
3. Open the incident channel (Slack #incidents or equivalent). Designate one
   incident commander.
4. Note the **time of awareness** — this starts the 72h Art. 33 clock.

## 2. Assess (within 12 hours)

Fill in the breach record below. Use the rubric in Art. 33(3) GDPR.

| Field | Notes |
|---|---|
| Time of awareness (UTC) | |
| Detection source | (alert / customer report / pen-test / external) |
| Nature of breach | confidentiality / integrity / availability |
| Categories of data subjects affected | (clienti del salone, operatori, owner) |
| Approximate number of data subjects | |
| Categories of personal data | (anagrafici, sanitari ex art. 9, foto, pagamenti) |
| Approximate number of records | |
| Likely consequences | |
| Containment measures already taken | |
| Open mitigations | |

Decide:

- **Art. 33** notification to authority: required unless the breach is
  *unlikely to result in a risk* to natural persons. Default = notify.
- **Art. 34** communication to data subjects: required when the breach is
  *likely to result in a high risk*. Default for any leak of art. 9 data,
  payment data, or credentials = notify.

## 3. Notify the salons (≤24h from awareness)

Send the templated email via the platform-admin endpoint:

```bash
# Notify a specific affected salon
curl -X POST https://app.lume.com/api/admin/notify-breach \
  -H "Content-Type: application/json" \
  -H "Cookie: <platform-admin-session>" \
  -d '{"salonId": "<uuid>", "summary": "...", "incidentRef": "INC-2026-…"}'

# Notify all salons (mass breach)
curl -X POST https://app.lume.com/api/admin/notify-breach \
  -H "Content-Type: application/json" \
  -H "Cookie: <platform-admin-session>" \
  -d '{"all": true, "summary": "...", "incidentRef": "INC-2026-…"}'
```

The email contains: nature, categories of data, approximate counts, mitigations
taken, recommended actions for the salon, contact for questions, and a link to
the salon's own breach-response template (Garante facsimile).

## 4. Notify Datatilsynet (≤72h)

File via https://www.datatilsynet.dk/anmeld-databrud (online form).

If the assessment is still incomplete at 72h, file an **interim notification**
with the information available and update later (Art. 33(4)).

If the breach is also material to Italian data subjects, file a **parallel
notification to the Garante** at https://servizi.gpdp.it via the cooperation
mechanism — keep both authorities aligned.

## 5. Notify data subjects (Art. 34) — when required

Direct communication to the affected individuals only when *high risk* is
present. Coordinate with each affected salon: the salon is the Titolare and
must communicate to its own clients, but Lume drafts the templated message.

The communication must be in **clear, plain language** and include the same
information as the authority notification.

## 6. Post-mortem (within 30 days)

- Root cause analysis filed under `internal/incidents/.../postmortem.md`.
- Corrective actions tracked as TODOs with owners.
- Update this runbook if any step proved unclear or ineffective.
- If the incident affected more than 100 salons OR involved Art. 9 data,
  schedule a board-level review.

## Contact escalation

| Role | Who | When |
|---|---|---|
| Incident commander | rotating, named at incident open | always |
| Legal / DPO advisor | external lawyer (TBD) | from step 2 onwards |
| Datatilsynet liaison | Lume founder | for filings under step 4 |
| Sub-processor contact | Supabase / Vercel / Resend / Stripe security teams | when their infra is implicated |
