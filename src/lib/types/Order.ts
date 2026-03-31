export class Order {
  id: string;
  salon_id: string;
  supplier_id: string;
  datetime: Date;
  status: string;

  constructor(order: Order) {
    this.id = order.id;
    this.salon_id = order.salon_id;
    this.supplier_id = order.supplier_id;
    this.datetime = order.datetime;
    this.status = order.status;
  }
}
