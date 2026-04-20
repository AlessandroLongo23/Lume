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
  className?: string;
}

const HTML_DETECTOR = /^\s*<[a-z!]/i;

export function MarkdownBody({ content, className = '' }: MarkdownBodyProps) {
  const isHtml = HTML_DETECTOR.test(content);
  const sanitized = useMemo(
    () => (isHtml ? sanitizeRichText(content) : ''),
    [isHtml, content],
  );

  const baseClass = `prose prose-sm prose-zinc dark:prose-invert max-w-none break-words ${className}`;

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
