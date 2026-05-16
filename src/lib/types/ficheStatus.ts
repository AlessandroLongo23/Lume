export enum FicheStatus {
  CREATED = 'created',
  PENDING = 'pending',
  COMPLETED = 'completed',
  /** Online booking awaiting owner/operator approval before becoming confirmed. */
  PENDING_APPROVAL = 'pending_approval',
  /** Online booking cancelled by client or staff; slot is free again. */
  CANCELLED = 'cancelled',
}
