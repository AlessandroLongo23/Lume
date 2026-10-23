import { unstable_isUnrecognizedActionError } from 'next/navigation';

export const STALE_DEPLOYMENT_MESSAGE =
  'È disponibile una nuova versione di Lume. Ricarica la pagina e riprova.';

/**
 * Calls a server action and turns Next's "Server Action … was not found" error into a
 * message the user can act on. It fires when the page was loaded before a deploy: the
 * browser still holds the old action ids and only a reload fixes it.
 */
export async function callServerAction<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (err) {
    if (unstable_isUnrecognizedActionError(err)) throw new Error(STALE_DEPLOYMENT_MESSAGE);
    throw err;
  }
}
