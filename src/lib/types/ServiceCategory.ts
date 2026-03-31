export class ServiceCategory {
  id: string;
  name: string;
  description: string;

  constructor(serviceCategory: ServiceCategory) {
    this.id = serviceCategory.id;
    this.name = serviceCategory.name;
    this.description = serviceCategory.description;
  }
}
