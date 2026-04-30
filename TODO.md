# TODO

## Bug
[ ] theme always applying on refresh, instead, it should stay the same

## Chiarimenti
[ ] Time preview on calendar cell hover
[*] Add # appointments for clients, qty. of products sold, and other stats to tables
[ ] applicazione abbonamento e dove trovare i dettagli
[ ] Patch notes system on login, automatically generated from commits and new pulsating badge for tutorials and features with overlays 

## Personalization and Freedom
[ ] Add column selection and sorting to all tables
[ ] different working hours for each operator

## Features
[ ] recurrent expenses (spotify, services, etc.)
[ ] notifica auguri sul gestionale
[ ] Tutorial for onboarding with the most important features (we should decide whether to have a video page tutorial, a classic steps with highlights or something more modern and advanced)
[ ] add vacation to calendar
[ ] white labeling online booking platform (service list, choose operator and time), with one time setup and editing page for service list, whether or not is possible to choose operator, and whether or not confirmation is necessary
[ ] tessera cliente
[ ] compact vs default table density, wired to settings

[ ] Add AI for speech to speech queries and actions (possibly free integrations)
[ ] AI Image geneation for products and services

## Impostazioni
[ ] double check if all settings work as they should

## Data
[ ] Set up automatic import with Anthropic API and Supabase MCP
[ ] passare tutti i dati da Stiv
[ ] add step to onboarding to load all your data

## Design
[ ] design all pages to be responsive and phone interactions
[ ] Audit the codebase to add animations using motion
[ ] Add fly in animation for pages when opening nested dynamic routes (like Modestas did with cursum ai)

## Codebase
[ ] Playwright automated testing
[ ] create staging environment for more robustness, testing and safety measure 
[ ] create staging database for testing
[ ] revisit client_stats / client_ratings aggregates once real salons have ~10k+ fiches — currently re-runs on every fiche/fiche_services/fiche_products realtime change; consider materialized view, debounce, or per-client RPC

## Admin page
[ ] Potential client list (phone numbers and which ones are already been called, where they're from, etc.)
[ ] Goal to 1% market coverage component (custom circular progress bar)
[ ] Create an automation that takes a voice recording/video recording, extracts the transcript (with speakers) and calls anthropic API with some context on the task to give back a report
and create an interface for it for managing the interviews and inspect the aggregated results

## Exploration
[ ] Do some market research and understand how to structure a broader scope once the CMS is out of development phase

## Integrations
[ ] instagram

## Landing page
[ ] Make scrolling clear
[ ] Add scrolling progress bar
[ ] Add screenshots and gif (from a populated fake salon) showcasing the features

=================================================================

# Done

## Features
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

## Chiarimenti
[x] week calendar is always clickable, but one of the operator is forced
[x] add eye icon for login modal password
[x] restructure and redesign client info page
[x] campi piu grandi
[x] spostare il bottone per chiudere le fiche dentro il modale
[x] cambiare il totale direttamente senza aggiornare i prezzi delle singole cose
[x] calendario filtro operatori visualizzazione messe (aggiornare colore e parziale (contro il totale))
[x] combobox a due livelli per servizi e prodotti nella fiche

## Bug
[x] avatar dropdown in sidebar
[x] togliere categorie clienti
[x] dropdown dell'abbonamento nella fiche nascosto
[x] merge valore gift card con importo incassato
[x] errore su gift card "Valore dello sconto non valido"
[x] messaggio fuori orario su chiusura fiche

## Impostazioni
[x] Settare valore di default per validità buoni

## Data

## Design

## Codebase