export class Review {
  id: string;
  client_id: string;
  rating: number;
  description: string;

  constructor(review: Review) {
    this.id = review.id;
    this.client_id = review.client_id;
    this.rating = review.rating;
    this.description = review.description;
  }
}
