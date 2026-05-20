export interface FicheServiceDraft {
  id?: string;
  service_id: string;
  name: string;
  operator_id: string;
  /** Absolute start of this service. Source of truth for its calendar position —
   *  the modal preserves it on load so a service moved on the calendar shows its
   *  real time (and isn't clobbered on save). `end_time` is derived as
   *  `start_time + duration`. */
  start_time: Date;
  duration: number;
  list_price: number;
  final_price: number;
  abbonamento_id?: string | null;
}

export interface FicheProductDraft {
  id?: string;
  product_id: string;
  name: string;
  quantity: number;
  list_price: number;
  final_price: number;
}
