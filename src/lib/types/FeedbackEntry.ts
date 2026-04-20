export type FeedbackType = 'suggestion' | 'bug' | 'idea';
export type FeedbackStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export interface FeedbackEntryRow {
  id: string;
  author_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  upvote_count: number;
  author_first_name: string | null;
  author_last_name: string | null;
  author_salon_id: string | null;
  author_salon_name: string | null;
  image_paths: string[] | null;
  linked_branch: string | null;
  linked_pr_url: string | null;
  comment_count: number;
}

export class FeedbackEntry {
  id: string;
  author_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  upvote_count: number;
  author_first_name: string | null;
  author_last_name: string | null;
  author_salon_id: string | null;
  author_salon_name: string | null;
  image_paths: string[];
  linked_branch: string | null;
  linked_pr_url: string | null;
  comment_count: number;

  constructor(row: FeedbackEntryRow) {
    this.id = row.id;
    this.author_id = row.author_id;
    this.type = row.type;
    this.title = row.title;
    this.description = row.description;
    this.status = row.status;
    this.created_at = row.created_at;
    this.updated_at = row.updated_at;
    this.completed_at = row.completed_at ?? null;
    this.upvote_count = row.upvote_count ?? 0;
    this.author_first_name = row.author_first_name ?? null;
    this.author_last_name = row.author_last_name ?? null;
    this.author_salon_id = row.author_salon_id ?? null;
    this.author_salon_name = row.author_salon_name ?? null;
    this.image_paths = row.image_paths ?? [];
    this.linked_branch = row.linked_branch ?? null;
    this.linked_pr_url = row.linked_pr_url ?? null;
    this.comment_count = row.comment_count ?? 0;
  }

  getAuthorName(): string {
    const first = this.author_first_name?.trim() ?? '';
    const last = this.author_last_name?.trim() ?? '';
    const combined = `${first} ${last}`.trim();
    return combined || 'Utente';
  }

  get isOpen(): boolean {
    return this.status === 'open';
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }
}
