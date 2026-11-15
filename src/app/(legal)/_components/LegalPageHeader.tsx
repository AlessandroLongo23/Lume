import type { ReactNode } from 'react';

/**
 * The top of every legal page: the title and the version / last-updated
 * line. It sits inside the layout's prose article, so the type comes from the
 * prose mapping there.
 */
export function LegalPageHeader({ title, meta }: { title: ReactNode; meta: ReactNode }) {
  return (
    <>
      <h1>{title}</h1>
      <p>
        <em>{meta}</em>
      </p>
    </>
  );
}
