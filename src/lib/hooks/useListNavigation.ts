'use client';

import { useCallback, useEffect, useState, type KeyboardEvent, type RefObject } from 'react';

/**
 * Arrow-key navigation for a list of rows: which row is keyboard-active,
 * scrolling it into view, Enter to pick, Escape to close. The active row gets
 * `highlighted` on <ListRow>, which the list's glide follows.
 */
export function useListNavigation({
  count,
  onPick,
  onEscape,
  listRef,
  pickFirstOnEnter = false,
}: {
  count: number;
  onPick: (index: number) => void;
  onEscape?: () => void;
  listRef?: RefObject<HTMLElement | null>;
  /** Enter with nothing highlighted picks the first row (search-as-you-type). */
  pickFirstOnEnter?: boolean;
}) {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (active < 0 || !listRef?.current) return;
    listRef.current.querySelectorAll<HTMLElement>('[data-list-row]')[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, listRef]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(i + 1, count - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActive(count > 0 ? 0 : -1);
        break;
      case 'End':
        e.preventDefault();
        setActive(count - 1);
        break;
      case 'Enter':
        if (active >= 0 && active < count) { e.preventDefault(); onPick(active); }
        else if (pickFirstOnEnter && count > 0) { e.preventDefault(); onPick(0); }
        break;
      case 'Escape':
        // Close the list only: a surrounding Modal listens on window too.
        e.stopPropagation();
        onEscape?.();
        break;
      case 'Tab':
        onEscape?.();
        break;
    }
  }, [active, count, onPick, onEscape, pickFirstOnEnter]);

  return { active, setActive, onKeyDown };
}
