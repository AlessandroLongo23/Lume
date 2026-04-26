import type { EntityType } from './types';

export type CommandEventDetail =
  | { kind: 'open-add';    entityType: EntityType; prefill?: Record<string, unknown> }
  | { kind: 'open-edit';   entityType: EntityType; id: string }
  | { kind: 'open-delete'; entityType: EntityType; id: string };

export const COMMAND_EVENT = 'lume:command';

export function dispatchCommand(detail: CommandEventDetail): void {
  window.dispatchEvent(new CustomEvent<CommandEventDetail>(COMMAND_EVENT, { detail }));
}

export function onCommand(
  entityType: EntityType,
  handler: (detail: Extract<CommandEventDetail, { entityType: EntityType }>) => void,
): () => void {
  function listener(event: Event) {
    const detail = (event as CustomEvent<CommandEventDetail>).detail;
    if (detail.entityType === entityType) handler(detail);
  }
  window.addEventListener(COMMAND_EVENT, listener);
  return () => window.removeEventListener(COMMAND_EVENT, listener);
}
