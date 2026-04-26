/**
 * useCommandSearch — drives the global command palette.
 *
 * Backing RPC: `public.search_global(q text)` returns
 *   (entity_type, id, label, subtitle, score real)
 * defined in the Supabase project (not committed; applied via MCP).
 * UNIONs over clients, operators, services, products, the two category
 * tables, fiches, coupons, abbonamenti — filtered to non-archived rows.
 *
 * Behaviour:
 *  - Empty query: synchronously yield recents + standalone actions + nav.
 *  - Non-empty query: locally filter nav/recents/standalone instantly,
 *    then debounce 150ms before hitting the RPC. Prior in-flight calls
 *    are aborted on the next keystroke; previous results stay visible
 *    via `staleResults` until new data arrives (stale-while-revalidate).
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import type { ProfileRole } from '@/lib/auth/roles';
import { useServicesStore } from '@/lib/stores/services';
import { adminRoutes, adminSettingsRoute } from '@/lib/const/data';

import { buildStandaloneActions, entityActionFactories, ENTITY_ICON } from './actions';
import { useRecents } from './recents';
import { score } from './score';
import type {
  ActionResult,
  CommandResult,
  EntityResult,
  EntitySummary,
  EntityType,
  NavResult,
} from './types';

const DEBOUNCE_MS = 150;

type RpcRow = {
  entity_type: EntityType;
  id: string;
  label: string;
  subtitle: string | null;
  score: number;
};

function buildHref(type: EntityType, id: string): string {
  switch (type) {
    case 'client':
      return `/admin/clienti/${id}`;
    case 'operator':
      return `/admin/operatori/${id}`;
    case 'product':
      return `/admin/magazzino/prodotti/${id}`;
    case 'order':
      return `/admin/ordini/${id}`;
    case 'service': {
      const services = useServicesStore.getState().services;
      const match = services.find((s) => s.id === id);
      return match?.category_id ? `/admin/servizi/${match.category_id}/${id}` : '/admin/servizi';
    }
    case 'service-category':
      return `/admin/servizi/${id}`;
    case 'product-category':
      return '/admin/magazzino';
    case 'fiche':
      return '/admin/fiches';
    case 'coupon':
      return '/admin/coupons';
    case 'abbonamento':
      return '/admin/abbonamenti';
  }
}

function buildNavResults(): NavResult[] {
  const all: NavResult[] = [];
  for (const group of adminRoutes) {
    for (const route of group.routes) {
      all.push({
        kind: 'nav',
        id: `nav-${route.url}`,
        label: route.name,
        href: `/admin/${route.url}`,
        icon: route.icon,
        keywords: route.searchKeywords,
        group: 'Vai a',
      });
    }
  }
  all.push({
    kind: 'nav',
    id: `nav-${adminSettingsRoute.url}`,
    label: adminSettingsRoute.name,
    href: `/admin/${adminSettingsRoute.url}`,
    icon: adminSettingsRoute.icon,
    keywords: adminSettingsRoute.searchKeywords,
    group: 'Vai a',
  });
  return all;
}

function makeEntityResult(entity: EntitySummary, role: ProfileRole | null): EntityResult {
  return {
    kind: 'entity',
    entity,
    icon: ENTITY_ICON[entity.type],
    actions: entityActionFactories[entity.type](entity, role),
  };
}

function makeStandaloneResults(role: ProfileRole | null): ActionResult[] {
  return buildStandaloneActions(role).map((action) => ({
    kind: 'action',
    action,
    group: 'Crea nuovo',
  }));
}

function rpcRowToEntity(row: RpcRow): EntitySummary {
  return {
    type: row.entity_type,
    id: row.id,
    label: row.label,
    subtitle: row.subtitle ?? undefined,
    href: buildHref(row.entity_type, row.id),
  };
}

export function useCommandSearch(
  query: string,
  role: ProfileRole | null,
): {
  results: CommandResult[];
  loading: boolean;
  isEmptyQuery: boolean;
} {
  const recents = useRecents();
  const navItems = useMemo(() => buildNavResults(), []);
  const standaloneItems = useMemo(() => makeStandaloneResults(role), [role]);

  const [entityResults, setEntityResults] = useState<EntityResult[]>([]);
  const [staleResults, setStaleResults] = useState<EntityResult[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();
  const isEmptyQuery = trimmed.length === 0;

  const lastResultsRef = useRef<EntityResult[]>([]);
  useEffect(() => {
    lastResultsRef.current = entityResults;
  }, [entityResults]);

  useEffect(() => {
    if (isEmptyQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- query becoming empty must drop in-flight UI state.
      setEntityResults([]);
      setStaleResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setStaleResults(lastResultsRef.current);

    const abort = new AbortController();
    const timeout = window.setTimeout(async () => {
      const { data, error } = await supabase
        .rpc('search_global', { q: trimmed })
        .abortSignal(abort.signal);

      if (abort.signal.aborted) return;

      if (error) {
        setEntityResults([]);
        setStaleResults([]);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as RpcRow[];
      const mapped = rows.map((row) => makeEntityResult(rpcRowToEntity(row), role));
      setEntityResults(mapped);
      setStaleResults([]);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      abort.abort();
    };
  }, [trimmed, isEmptyQuery, role]);

  const filteredNav = useMemo(() => {
    if (isEmptyQuery) return navItems;
    return navItems
      .map((item) => ({ item, s: score(trimmed, item.label, item.keywords) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.item);
  }, [navItems, trimmed, isEmptyQuery]);

  const filteredStandalone = useMemo(() => {
    if (isEmptyQuery) return standaloneItems;
    return standaloneItems
      .map((item) => ({ item, s: score(trimmed, item.action.label) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.item);
  }, [standaloneItems, trimmed, isEmptyQuery]);

  const filteredRecents = useMemo(() => {
    if (recents.length === 0) return [] as EntityResult[];
    if (isEmptyQuery) return recents.map((entity) => makeEntityResult(entity, role));
    return recents
      .map((entity) => ({ entity, s: score(trimmed, entity.label, entity.subtitle ? [entity.subtitle] : []) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => makeEntityResult(r.entity, role));
  }, [recents, trimmed, isEmptyQuery, role]);

  const results = useMemo<CommandResult[]>(() => {
    if (isEmptyQuery) {
      return [...filteredRecents, ...filteredStandalone, ...filteredNav];
    }
    const liveOrStale = entityResults.length > 0 ? entityResults : staleResults;
    const dedupedLiveOrStale = liveOrStale.filter(
      (e) => !filteredRecents.some((r) => r.entity.id === e.entity.id && r.entity.type === e.entity.type),
    );
    return [...filteredNav, ...filteredRecents, ...dedupedLiveOrStale, ...filteredStandalone];
  }, [isEmptyQuery, filteredRecents, filteredStandalone, filteredNav, entityResults, staleResults]);

  return { results, loading, isEmptyQuery };
}
