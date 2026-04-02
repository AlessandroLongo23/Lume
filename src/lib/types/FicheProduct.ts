export class FicheProduct {
  id: string;
  salon_id: string;
  fiche_id: string;
  product_id: string;
  quantity: number;
  list_price: number;
  final_price: number;

  constructor(ficheProduct: FicheProduct) {
    this.id = ficheProduct.id;
    this.salon_id = ficheProduct.salon_id;
    this.fiche_id = ficheProduct.fiche_id;
    this.product_id = ficheProduct.product_id;
    this.quantity = ficheProduct.quantity ?? 1;
    this.list_price = ficheProduct.list_price ?? 0;
    this.final_price = ficheProduct.final_price ?? 0;
  }
}
