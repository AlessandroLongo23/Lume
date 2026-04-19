import Link from 'next/link';
import { MessageSquare, ChevronUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import type { FeedbackType, FeedbackStatus } from '@/lib/types/FeedbackEntry';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type EntryRow = {
  id:           string;
  author_id:    string;
  type:         FeedbackType;
  title:        string;
  description:  string;
  status:       FeedbackStatus;
  created_at:   string;
  upvote_count: number;
};

type ProfileRow = { id: string; first_name: string; last_name: string; salon_id: string };
type SalonRow   = { id: string; name: string };

const TYPE_LABEL: Record<FeedbackType, string> = {
  suggestion: 'Suggerimento',
  bug:        'Bug',
  idea:       'Idea',
};

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  open:        'Aperto',
  in_progress: 'In lavorazione',
  completed:   'Completato',
  closed:      'Chiuso',
};

export default async function PlatformFeedbackPage() {
  const supabase = getAdminClient();

  const { data: entries } = await supabase
    .from('feedback_entries')
    .select('id, author_id, type, title, description, status, created_at, upvote_count')
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<EntryRow[]>();

  const authorIds = [...new Set((entries ?? []).map((e) => e.author_id))];
  const { data: profiles } = authorIds.length
    ? await supabase
        .from('profiles')
        .select('id, first_name, last_name, salon_id')
        .in('id', authorIds)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const salonIds = [...new Set((profiles ?? []).map((p) => p.salon_id).filter(Boolean))];
  const { data: salons } = salonIds.length
    ? await supabase
        .from('salons')
        .select('id, name')
        .in('id', salonIds)
        .returns<SalonRow[]>()
    : { data: [] as SalonRow[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const salonById   = new Map((salons ?? []).map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feedback"
        subtitle="Richieste da tutti i saloni, ordinate per voti"
        icon={MessageSquare}
      />

      {(entries?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <MessageSquare className="size-10 mb-3" strokeWidth={1.5} />
          <p className="text-sm">Nessun feedback ancora.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(entries ?? []).map((entry) => {
            const profile = profileById.get(entry.author_id);
            const salon   = profile ? salonById.get(profile.salon_id) : null;
            const authorName = profile
              ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Utente'
              : 'Utente';
            return (
              <div
                key={entry.id}
                className="flex flex-row items-start gap-4 w-full p-4 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800/50"
              >
                <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 w-14 py-2 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
                  <ChevronUp className="size-4" strokeWidth={2.5} />
                  <span className="text-sm font-semibold tabular-nums">{entry.upvote_count}</span>
                </div>

                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex flex-row items-center flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-300">
                      {TYPE_LABEL[entry.type]}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-hover dark:text-primary/70">
                      {STATUS_LABEL[entry.status]}
                    </span>
                    {salon && (
                      <Link
                        href={`/platform/salons`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {salon.name}
                        <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {entry.title}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                    {entry.description.length > 300
                      ? entry.description.slice(0, 300).trimEnd() + '…'
                      : entry.description}
                  </p>

                  <div className="flex flex-row items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{authorName}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span>{format(new Date(entry.created_at), 'd MMM yyyy', { locale: it })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
