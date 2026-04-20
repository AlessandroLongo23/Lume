import type { ProfileRole } from '@/lib/auth/roles';

export interface FeedbackCommentRow {
  id: string;
  feedback_id: string;
  author_id: string;
  body: string;
  image_paths: string[] | null;
  created_at: string;
  updated_at: string;
  author_first_name: string | null;
  author_last_name: string | null;
  author_role: ProfileRole | null;
  author_salon_id: string | null;
  author_salon_name: string | null;
}

export class FeedbackComment {
  id: string;
  feedback_id: string;
  author_id: string;
  body: string;
  image_paths: string[];
  created_at: string;
  updated_at: string;
  author_first_name: string | null;
  author_last_name: string | null;
  author_role: ProfileRole | null;
  author_salon_id: string | null;
  author_salon_name: string | null;

  constructor(row: FeedbackCommentRow) {
    this.id = row.id;
    this.feedback_id = row.feedback_id;
    this.author_id = row.author_id;
    this.body = row.body;
    this.image_paths = row.image_paths ?? [];
    this.created_at = row.created_at;
    this.updated_at = row.updated_at;
    this.author_first_name = row.author_first_name ?? null;
    this.author_last_name = row.author_last_name ?? null;
    this.author_role = row.author_role ?? null;
    this.author_salon_id = row.author_salon_id ?? null;
    this.author_salon_name = row.author_salon_name ?? null;
  }

  getAuthorName(): string {
    const first = this.author_first_name?.trim() ?? '';
    const last = this.author_last_name?.trim() ?? '';
    const combined = `${first} ${last}`.trim();
    return combined || 'Utente';
  }

  get isEditable(): boolean {
    return Date.now() - new Date(this.created_at).getTime() < 15 * 60 * 1000;
  }
}
