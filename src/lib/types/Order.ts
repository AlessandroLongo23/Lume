export class Order {
  id: string;
  supplier_id: string;
  datetime: Date;
  status: string;

  constructor(order: Order) {
    this.id = order.id;
    this.supplier_id = order.supplier_id;
    this.datetime = order.datetime;
    this.status = order.status;
  }
}
