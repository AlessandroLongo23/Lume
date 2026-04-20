import sanitizeHtml, { type IOptions } from 'sanitize-html';

const OPTIONS: IOptions = {
  allowedTags: [
    'p', 'br',
    'strong', 'em', 's', 'code', 'pre',
    'blockquote',
    'ul', 'ol', 'li',
    'a',
    'h3', 'h4',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
