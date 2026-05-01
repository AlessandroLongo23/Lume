# TODO

## Bug

## UX 
[*] (M) Add # appointments for clients, qty. of products sold, and other stats to tables
[ ] (M) applicazione abbonamento e dove trovare i dettagli
[ ] (L) Set up a "patch notes" system on login, automatically generated from commits and new pulsating badge for tutorials and features with overlays 

## Personalization

## Features
[ ] (L) recurrent expenses (spotify, services, etc.)
[ ] (M) notifica auguri sul gestionale
[ ] (L) Tutorial for onboarding with the most important features (we should decide whether to have a video page tutorial, a classic steps with highlights or something more modern and advanced)
[ ] (L) white labeling online booking platform (service list, choose operator and time), with one time setup and editing page for service list, whether or not is possible to choose operator, and whether or not confirmation is necessary
[ ] (L) tessera cliente
[ ] (XL) GDPR audit and look for "deliberatorie" and other necessary documents for ready to print, already filled forms (ask Ulisse about those)
[ ] (XL) AI for speech to speech queries and actions (possibly free integrations)
[ ] (L) AI Image generation for products and services
[ ] (M) Add multi-salon owner with salon selection on login and salon dropdown selection where we now have the salon name

## Impostazioni

## Data
[ ] (XL) Set up automatic import with Anthropic API and Supabase MCP
  [ ] (M) passare tutti i dati da Stiv
  [ ] (L) when it detects if there's already data for that salon, it should ask if it wants to add (blind adding), overwrite (clean slate), or merge (smart adding)
[ ] (M) add step to onboarding to load all your data

## Design
[ ] (L) design all pages to be responsive and design intuitive phone interactions, especially for tables and the calendar page
[ ] (L) Audit the codebase to add animations using motion
[ ] (M) Add fly in animation for pages when opening nested dynamic routes (like Modestas did with cursum ai)
[ ] (S) dropdown below three dots button has the same spacing between btn and dropdown than between btn and other btn
[ ] (S) animate archive and delete icons in the clients' card
[ ] (S) Replace default dropdown selections with our custom one

## Codebase
[ ] (L) Playwright automated testing
[ ] (L) create staging environment for more robustness, testing and safety measure 
[ ] (L) create staging database for testing
[ ] (M) revisit client_stats / client_ratings aggregates once real salons have ~10k+ fiches — currently re-runs on every fiche/fiche_services/fiche_products realtime change; consider materialized view, debounce, or per-client RPC

## Admin page
[ ] (M) Goal to 1% market coverage component (custom circular progress bar)
[ ] (M) statistics about the settings chosen by business

## Exploration
[ ] (M) Do some market research and understand how to structure a broader scope once the CMS is out of development phase
[ ] (L) Potential client list (phone numbers and which ones are already been called, where they're from, etc.)
[ ] (L) Create an automation that takes a voice recording/video recording, extracts the transcript (with speakers) and calls anthropic API with some context on the task to give back a report
and create an interface for it for managing the interviews and inspect the aggregated results

## Integrations
[ ] (M) instagram

## Landing page
[ ] (S) Make scrolling clear
[ ] (S) Add scrolling progress bar
[ ] (M) Add screenshots and gif (from a populated fake salon) showcasing the features

=================================================================

# Done

## Bug
[x] (S) Fix the z-index on the dropdown in the client's detail page
[x] (S) Make so that the unavailability slot in the calendar stays during the confirmation modal
[x] (S) In settings, every time you change section the animation triggers, and it shouldn't
[x] theme always applying on refresh, instead, it should stay the same
[x] avatar dropdown in sidebar
[x] togliere categorie clienti
[x] dropdown dell'abbonamento nella fiche nascosto
[x] merge valore gift card con importo incassato
[x] errore su gift card "Valore dello sconto non valido"
[x] messaggio fuori orario su chiusura fiche

## Personalization
[x] different working hours for each operator
[x] Add column selection and sorting to all tables

## Features
[x] add vacation to calendar
[x] compact vs default table density, wired to settings
[x] change service names at checkout
[x] easier drag and drop calendar actions
[x] "Scheda tecnica" con campi (data, miscela, tecnica, note) accessibile da tutte le parti (hover solo l'ultima e click per pagina intera). Cambiare nota nel modale delle fiche
[x] archiviare servizi e prodotti, clienti invece di cancellarli
[x] possibilità di segnare servizi come omaggio (quindi 0€)
[x] creazione coupon (servizio/soldi)
  [x] omaggi dal negozio
  [x] buono regalo
[x] feedback page con up/down
[x] pagina abbonamento
[x] togliere email obbligatoria per creare cliente
[x] (M) Add a bug button fixed to the bottom right corner (down aligned with the theme button) to take a screenshot of the current page, and when the screenshot is taken, it automatically opens the feedback modal with bug preselected and the screenshot already uploaded

## UX
[x] (S) Add drag icon (six dots) to service blocks in calendar on hovering (animation pushing the text)
[x] (S) Add breadcrumb navigation and add entity details page to the list
[x] (S) Click abbonamento row to open edit modal
[x] Time preview on calendar cell hover
[x] week calendar is always clickable, but one of the operator is forced
[x] add eye icon for login modal password
[x] restructure and redesign client info page
[x] campi piu grandi
[x] spostare il bottone per chiudere le fiche dentro il modale
[x] cambiare il totale direttamente senza aggiornare i prezzi delle singole cose
[x] calendario filtro operatori visualizzazione messe (aggiornare colore e parziale (contro il totale))
[x] combobox a due livelli per servizi e prodotti nella fiche

## Impostazioni
[x] Settare valore di default per validità buoni

## Data
[x] (S) add "Importa dati" option to all three dots dropdown in every page

## Design

## Codebase