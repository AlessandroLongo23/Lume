export interface ReviewRow {
  id: string;
  author_id: string;
  rating: number;
  message: string;
  created_at: string;
  updated_at: string;
}

/**
 * A review enriched with author + salon metadata, used to render the landing
 * page testimonials. Built server-side by joining `profiles` and `salons` at
 * fetch time (columns are not stored on the reviews table itself).
 */
export interface ReviewWithAuthor extends ReviewRow {
  author_first_name: string | null;
  author_last_name: string | null;
  author_role: 'owner' | 'operator';
  salon_name: string | null;
}

export class Review implements ReviewRow {
  id: string;
  author_id: string;
  rating: number;
  message: string;
  created_at: string;
  updated_at: string;

  constructor(row: ReviewRow) {
    this.id = row.id;
    this.author_id = row.author_id;
    this.rating = row.rating;
    this.message = row.message;
    this.created_at = row.created_at;
    this.updated_at = row.updated_at;
  }
}
