import type { Metadata } from 'next';
import Link from 'next/link';
import { LUME_LEGAL } from '@/lib/const/legal';
import {
  SUB_PROCESSORS,
  SUB_PROCESSORS_LAST_UPDATED,
} from '@/lib/const/subProcessors';

export const metadata: Metadata = {
  title: 'Sub-processors — Lume',
  description:
    'Elenco aggiornato dei sub-responsabili del trattamento utilizzati da Lume ai sensi dell’art. 28 GDPR.',
};

export default function SubProcessorsPage() {
  return (
    <>
      <h1>Sub-processors</h1>
      <p>
        <em>Ultimo aggiornamento: {SUB_PROCESSORS_LAST_UPDATED}.</em>
      </p>
      <p>
        Lume si avvale dei seguenti sub-responsabili del trattamento (sub-processors) per
        erogare il Servizio. Ciascun sub-responsabile &egrave; vincolato da contratto a
        garantire un livello di protezione dei dati equivalente a quello previsto dal{' '}
        <Link href="/dpa">Data Processing Agreement</Link> di Lume.
      </p>
      <p>
        Le modifiche all&apos;elenco vengono comunicate ai Clienti attivi via email con almeno{' '}
        <strong>30 giorni</strong> di preavviso. Il Cliente pu&ograve; opporsi per motivi
        giustificati entro 15 giorni dalla notifica scrivendo a{' '}
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>.
      </p>

      <h2>Elenco</h2>
      <table>
        <thead>
          <tr>
            <th>Sub-responsabile</th>
            <th>Finalit&agrave;</th>
            <th>Paese</th>
            <th>Garanzie per il trasferimento</th>
          </tr>
        </thead>
        <tbody>
          {SUB_PROCESSORS.map((sp) => (
            <tr key={sp.name}>
              <td>
                <a href={sp.url} target="_blank" rel="noreferrer">
                  <strong>{sp.name}</strong>
                </a>
                <br />
                <a
                  href={sp.privacyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs"
                >
                  Privacy policy
                </a>
              </td>
              <td>{sp.purpose}</td>
              <td>{sp.country}</td>
              <td>{sp.transferMechanism}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Trasferimenti extra-UE</h2>
      <p>
        I sub-responsabili con sede negli Stati Uniti trattano i dati sulla base delle{' '}
        <em>Clausole Contrattuali Standard</em> approvate dalla Commissione Europea
        (decisione di esecuzione 2021/914) e di misure supplementari tecniche e
        organizzative (cifratura in transito e a riposo, controlli di accesso, logging
        privilegiato).
      </p>

      <h2>Contatti</h2>
      <p>
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>
      </p>
    </>
  );
}
