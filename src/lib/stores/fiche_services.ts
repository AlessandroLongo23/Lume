import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { FicheService } from '@/lib/types/FicheService';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { useFichesStore } from '@/lib/stores/fiches';

interface PlannedSegment {
  ficheServiceId: string;
  start: Date;
  end: Date;
  operatorId: string;
}

interface FicheServicesState {
  fiche_services: FicheService[];
  isLoading: boolean;
  error: string | null;
  /** Ids whose realtime echoes should be ignored (we just wrote them locally). */
  pendingMutationIds: Set<string>;
  fetchFicheServices: () => Promise<void>;
  addFicheService: (ficheService: Partial<FicheService>) => Promise<FicheService>;
  updateFicheService: (id: string, updated: Partial<FicheService>) => Promise<FicheService>;
  deleteFicheService: (id: string) => Promise<void>;
  /**
   * Optimistically apply a planned set of segment updates and persist them.
   * Used for drag-to-move and resize. On any failure, the snapshot is restored.
   */
  applyPlannedSegments: (segments: PlannedSegment[]) => Promise<void>;
}

const PENDING_TTL_MS = 1500; // covers the 300ms realtime debounce + roundtrip

function clearPendingAfter(ids: string[]) {
  setTimeout(() => {
    useFicheServicesStore.setState((s) => {
      const next = new Set(s.pendingMutationIds);
      ids.forEach((id) => next.delete(id));
      return { pendingMutationIds: next };
    });
  }, PENDING_TTL_MS);
}

export const useFicheServicesStore = create<FicheServicesState>((set, get) => ({
  fiche_services: [],
  isLoading: true,
  error: null,
  pendingMutationIds: new Set<string>(),

  fetchFicheServices: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const { data, error } = await supabase
      .from('fiche_services')
      .select('*')
      .gte('start_time', since.toISOString());
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ fiche_services: data.map((fs) => new FicheService(fs)), isLoading: false, error: null });
  },

  addFicheService: async (ficheService) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase
      .from('fiche_services')
      .insert([{ ...ficheService, salon_id: activeSalonId }])
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiungere il servizio alla fiche.');
    const newFicheService = new FicheService(data);
    set((s) => ({ fiche_services: [...s.fiche_services, newFicheService] }));
    return newFicheService;
  },

  updateFicheService: async (id, updated) => {
    const { data, error } = await supabase
      .from('fiche_services')
      .update(updated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare il servizio della fiche.');
    const updatedFs = new FicheService(data);
    set((s) => ({ fiche_services: s.fiche_services.map((fs) => (fs.id === id ? updatedFs : fs)) }));
    return updatedFs;
  },

  deleteFicheService: async (id) => {
    const { error } = await supabase.from('fiche_services').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il servizio dalla fiche.');
    set((s) => ({ fiche_services: s.fiche_services.filter((fs) => fs.id !== id) }));
  },

  applyPlannedSegments: async (segments) => {
    if (segments.length === 0) return;

    const snapshot = get().fiche_services;
    const segmentMap = new Map(segments.map((s) => [s.ficheServiceId, s]));

    // Optimistic local apply
    set((s) => ({
      fiche_services: s.fiche_services.map((fs) => {
        const seg = segmentMap.get(fs.id);
        if (!seg) return fs;
        const durationMin = Math.max(
          1,
          Math.round((seg.end.getTime() - seg.start.getTime()) / 60000),
        );
        return new FicheService({
          ...fs,
          start_time: seg.start,
          end_time: seg.end,
          operator_id: seg.operatorId,
          duration: durationMin,
        } as unknown as FicheService);
      }),
      pendingMutationIds: new Set([
        ...s.pendingMutationIds,
        ...segments.map((seg) => seg.ficheServiceId),
      ]),
    }));

    // Sync Fiche.datetime if a fiche's chronologically-first service moved.
    const affectedFicheIds = new Set<string>();
    for (const seg of segments) {
      const fs = snapshot.find((x) => x.id === seg.ficheServiceId);
      if (fs) affectedFicheIds.add(fs.fiche_id);
    }

    const fichesStore = useFichesStore.getState();
    const ficheDatetimeUpdates: { ficheId: string; previous: Date; next: Date }[] = [];
    for (const ficheId of affectedFicheIds) {
      const allForFiche = get().fiche_services.filter((fs) => fs.fiche_id === ficheId);
      if (allForFiche.length === 0) continue;
      const earliest = allForFiche
        .map((fs) => new Date(fs.start_time).getTime())
        .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);
      const fiche = fichesStore.fiches.find((f) => f.id === ficheId);
      const previous = fiche ? new Date(fiche.datetime) : null;
      if (fiche && previous && earliest !== previous.getTime()) {
        ficheDatetimeUpdates.push({
          ficheId,
          previous,
          next: new Date(earliest),
        });
      }
    }

    // Optimistic Fiche.datetime apply
    if (ficheDatetimeUpdates.length > 0) {
      useFichesStore.setState((s) => ({
        fiches: s.fiches.map((f) => {
          const u = ficheDatetimeUpdates.find((x) => x.ficheId === f.id);
          if (!u) return f;
          // Keep class identity by reusing the constructor.
          const Cls = f.constructor as { new (data: unknown): typeof f };
          return new Cls({ ...f, datetime: u.next });
        }),
        pendingMutationIds: new Set([
          ...s.pendingMutationIds,
          ...ficheDatetimeUpdates.map((u) => u.ficheId),
        ]),
      }));
    }

    // Persist
    try {
      await Promise.all(
        segments.map((seg) =>
          supabase
            .from('fiche_services')
            .update({
              start_time: seg.start.toISOString(),
              end_time: seg.end.toISOString(),
              operator_id: seg.operatorId,
              duration: Math.max(
                1,
                Math.round((seg.end.getTime() - seg.start.getTime()) / 60000),
              ),
            })
            .eq('id', seg.ficheServiceId)
            .then((res) => {
              if (res.error) throw new Error(res.error.message);
            }),
        ),
      );

      if (ficheDatetimeUpdates.length > 0) {
        await Promise.all(
          ficheDatetimeUpdates.map((u) =>
            supabase
              .from('fiches')
              .update({ datetime: u.next.toISOString() })
              .eq('id', u.ficheId)
              .then((res) => {
                if (res.error) throw new Error(res.error.message);
              }),
          ),
        );
      }

      clearPendingAfter([
        ...segments.map((s) => s.ficheServiceId),
        ...ficheDatetimeUpdates.map((u) => u.ficheId),
      ]);
    } catch (err) {
      // Rollback both stores
      set({ fiche_services: snapshot });
      if (ficheDatetimeUpdates.length > 0) {
        useFichesStore.setState((s) => ({
          fiches: s.fiches.map((f) => {
            const u = ficheDatetimeUpdates.find((x) => x.ficheId === f.id);
            if (!u) return f;
            const Cls = f.constructor as { new (data: unknown): typeof f };
            return new Cls({ ...f, datetime: u.previous });
          }),
        }));
      }
      // Drop pending markers immediately so realtime can refresh
      set((s) => {
        const next = new Set(s.pendingMutationIds);
        segments.forEach((seg) => next.delete(seg.ficheServiceId));
        return { pendingMutationIds: next };
      });
      useFichesStore.setState((s) => {
        const next = new Set(s.pendingMutationIds);
        ficheDatetimeUpdates.forEach((u) => next.delete(u.ficheId));
        return { pendingMutationIds: next };
      });
      throw err instanceof Error
        ? err
        : new Error('Impossibile aggiornare gli appuntamenti.');
    }
  },
}));
