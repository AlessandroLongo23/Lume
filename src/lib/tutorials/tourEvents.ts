/**
 * Tiny event bus that lets an `action` tour step advance on something other than
 * navigation — e.g. a "create" modal saving successfully. A step sets
 * `completeOn: 'client:created'`; the relevant store/modal calls
 * `emitTourEvent('client:created')` after a successful write; `TourBridge`
 * advances the tour when the current step's `completeOn` fires.
 *
 * Emitting an event with no tour running is a harmless no-op (no listeners).
 */
type TourEventHandler = () => void;

const handlers = new Map<string, Set<TourEventHandler>>();

export function onTourEvent(name: string, handler: TourEventHandler): () => void {
  let set = handlers.get(name);
  if (!set) {
    set = new Set();
    handlers.set(name, set);
  }
  set.add(handler);
  return () => {
    set?.delete(handler);
  };
}

export function emitTourEvent(name: string): void {
  handlers.get(name)?.forEach((h) => h());
}
