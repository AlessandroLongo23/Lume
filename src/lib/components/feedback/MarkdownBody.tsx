'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { useMemo } from 'react';
import { sanitizeRichText } from '@/lib/utils/sanitizeRichText';

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), ['target'], ['rel']],
  },
};

interface MarkdownBodyProps {
  content: string;
}

// The typography plugin's colour variables mapped onto the semantic tokens, so
// one set reads in both themes (no palette theme, no prose-invert).
const PROSE_TOKENS = [
  '[--tw-prose-body:var(--lume-text)]',
  '[--tw-prose-headings:var(--lume-text)]',
  '[--tw-prose-lead:var(--lume-text-secondary)]',
  '[--tw-prose-links:var(--lume-text)]',
  '[--tw-prose-bold:var(--lume-text)]',
  '[--tw-prose-counters:var(--lume-text-muted)]',
  '[--tw-prose-bullets:var(--lume-text-muted)]',
  '[--tw-prose-hr:var(--lume-line)]',
  '[--tw-prose-quotes:var(--lume-text-secondary)]',
  '[--tw-prose-quote-borders:var(--lume-edge)]',
  '[--tw-prose-captions:var(--lume-text-muted)]',
  '[--tw-prose-code:var(--lume-text)]',
  '[--tw-prose-pre-code:var(--lume-text)]',
  '[--tw-prose-pre-bg:var(--lume-active)]',
  '[--tw-prose-th-borders:var(--lume-edge)]',
  '[--tw-prose-td-borders:var(--lume-line)]',
].join(' ');

const HTML_DETECTOR = /^\s*<[a-z!]/i;

export function MarkdownBody({ content }: MarkdownBodyProps) {
  const isHtml = HTML_DETECTOR.test(content);
  const sanitized = useMemo(
    () => (isHtml ? sanitizeRichText(content) : ''),
    [isHtml, content],
  );

  const baseClass = `prose prose-sm max-w-none break-words ${PROSE_TOKENS}`;

  if (isHtml) {
    return <div className={baseClass} dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }

  return (
    <div className={baseClass}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
