export class Review {
  id: string;
  salon_id: string;
  client_id: string;
  rating: number;
  description: string;

  constructor(review: Review) {
    this.id = review.id;
    this.salon_id = review.salon_id;
    this.client_id = review.client_id;
    this.rating = review.rating;
    this.description = review.description;
  }
}
