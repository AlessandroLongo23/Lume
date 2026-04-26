import { useEffect, useState } from 'react';

import type { EntitySummary } from './types';

const STORAGE_KEY = 'lume.commandMenu.recents.v1';
const MAX_RECENTS = 20;
const UPDATE_EVENT = 'lume:command-recents-updated';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readRaw(): EntitySummary[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is EntitySummary =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { type?: unknown }).type === 'string' &&
      typeof (item as { label?: unknown }).label === 'string' &&
      typeof (item as { href?: unknown }).href === 'string',
    );
  } catch {
    return [];
  }
}

export function readRecents(): EntitySummary[] {
  return readRaw().slice(0, MAX_RECENTS);
}

export function trackRecent(entity: EntitySummary): void {
  if (!isBrowser()) return;
  const existing = readRaw();
  const dedupeKey = `${entity.type}:${entity.id}`;
  const next = [entity, ...existing.filter((e) => `${e.type}:${e.id}` !== dedupeKey)].slice(
    0,
    MAX_RECENTS,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch {
    // localStorage full or disabled — fail silently; recents are a UX nicety.
  }
}

export function useRecents(): EntitySummary[] {
  const [recents, setRecents] = useState<EntitySummary[]>(() => readRecents());

  useEffect(() => {
    function refresh() {
      setRecents(readRecents());
    }
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return recents;
}
