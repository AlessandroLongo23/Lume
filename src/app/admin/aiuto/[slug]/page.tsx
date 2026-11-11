'use client';

import { useParams } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { getTutorialBySlug } from '@/lib/tutorials/registry';
import { StartGuideButton } from '@/lib/components/admin/tutorials/StartGuideButton';
import { TutorialArticle } from '@/lib/components/admin/tutorials/TutorialArticle';
import { TutorialVideo } from '@/lib/components/admin/tutorials/TutorialVideo';
import { ComplexityBadge, ScopeChips } from '@/lib/components/admin/tutorials/TutorialTags';

export default function TutorialPage() {
  const params = useParams<{ slug: string }>();
  const tutorial = getTutorialBySlug(params.slug);

  const back = { href: '/admin/aiuto', label: 'Torna all’aiuto' };

  if (!tutorial) {
    return <PageHeader back={back} title="Tutorial non trovato" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={back}
        title={tutorial.title}
        subtitle={tutorial.summary}
        actions={
          tutorial.tourId ? (
            <StartGuideButton tutorialId={tutorial.id} welcome={tutorial.welcome} />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <ComplexityBadge complexity={tutorial.complexity} />
        <ScopeChips scopes={tutorial.scopes} />
      </div>

      {/* Video, as wide as the page: it is the first thing to reach for. Until a
          tutorial has one, a quiet placeholder holds a smaller spot. */}
      {tutorial.videoPath ? (
        <TutorialVideo key={tutorial.videoPath} videoPath={tutorial.videoPath} title={tutorial.title} />
      ) : (
        // ds-ignore: a dashed placeholder holding the video's spot, not a card; surface-card would swap the dashed edge for a solid hairline
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-xl border border-dashed border-[var(--lume-border)] bg-[var(--lume-surface-raised)] text-[var(--lume-text-secondary)]">
          <div className="flex flex-col items-center gap-2 text-sm">
            <PlayCircle className="size-8 opacity-60" />
            Video in arrivo
          </div>
        </div>
      )}

      {/* Article: the same steps in words and screenshots, for whoever would
          rather read. Markdown served from public/tutorials/<slug>/article.md. */}
      {tutorial.articleSlug ? (
        <TutorialArticle key={tutorial.articleSlug} slug={tutorial.articleSlug} />
      ) : (
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--lume-text-secondary)]">
          L’articolo con le istruzioni passo passo arriverà presto. Nel frattempo puoi seguire la guida
          interattiva qui sopra.
        </p>
      )}
    </div>
  );
}
