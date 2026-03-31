export class ServiceCategory {
  id: string;
  salon_id: string;
  name: string;
  description: string;

  constructor(serviceCategory: ServiceCategory) {
    this.id = serviceCategory.id;
    this.salon_id = serviceCategory.salon_id;
    this.name = serviceCategory.name;
    this.description = serviceCategory.description;
  }
}
