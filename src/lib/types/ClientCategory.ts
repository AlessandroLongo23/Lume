export class ClientCategory {
  id: string;
  salon_id: string;
  name: string;

  constructor(clientCategory: ClientCategory) {
    this.id = clientCategory.id;
    this.salon_id = clientCategory.salon_id;
    this.name = clientCategory.name;
  }
}
