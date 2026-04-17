export interface FicheServiceDraft {
  id?: string;
  service_id: string;
  name: string;
  operator_id: string;
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
