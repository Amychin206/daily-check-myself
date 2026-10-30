import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Blueprint, emptyBlueprint, GrowthData, GrowthDay, newDay } from './growth';

// Local data for the 成长 tab. Like check-in entries, each piece (the
// blueprint, and each day) carries updatedAt so devices merge newest-wins.

type GrowthValue = {
  ready: boolean;
  data: GrowthData;
  /** The saved day, or a fresh one prefilled from the blueprint. */
  getDay: (date: string) => GrowthDay;
  updateBlueprint: (patch: Partial<Omit<Blueprint, 'updatedAt'>>) => void;
  updateDay: (date: string, patch: Partial<Omit<GrowthDay, 'date' | 'updatedAt'>>) => void;
  /** Merges data from another device or a backup; returns how many pieces changed. */
  mergeGrowth: (incoming: Partial<GrowthData>) => number;
  /** The latest data, even mid-render. */
  snapshot: () => GrowthData;
};

const GROWTH_KEY = 'growth.v1';

const GrowthContext = createContext<GrowthValue | null>(null);

const newer = (a: { updatedAt: string } | null | undefined, b: { updatedAt: string } | null | undefined) =>
  !!a && (!b || Date.parse(a.updatedAt) > Date.parse(b.updatedAt));

export function GrowthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<GrowthData>({ blueprint: null, days: {} });
  const dataRef = useRef<GrowthData>(data);

  const commit = useCallback((next: GrowthData) => {
    dataRef.current = next;
    setData(next);
    AsyncStorage.setItem(GROWTH_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(GROWTH_KEY).then((raw) => {
      if (raw) {
        dataRef.current = JSON.parse(raw);
        setData(dataRef.current);
      }
      setReady(true);
    });
  }, []);

  const getDay = useCallback((date: string) => data.days[date] ?? newDay(date, data.blueprint), [data]);

  const updateBlueprint = useCallback<GrowthValue['updateBlueprint']>(
    (patch) => {
      const cur = dataRef.current;
      commit({
        ...cur,
        blueprint: { ...(cur.blueprint ?? emptyBlueprint()), ...patch, updatedAt: new Date().toISOString() },
      });
    },
    [commit],
  );

  const updateDay = useCallback<GrowthValue['updateDay']>(
    (date, patch) => {
      const cur = dataRef.current;
      const prev = cur.days[date] ?? newDay(date, cur.blueprint);
      commit({
        ...cur,
        days: { ...cur.days, [date]: { ...prev, ...patch, date, updatedAt: new Date().toISOString() } },
      });
    },
    [commit],
  );

  const mergeGrowth = useCallback(
    (incoming: Partial<GrowthData>) => {
      const cur = dataRef.current;
      let changed = 0;
      let blueprint = cur.blueprint;
      if (newer(incoming.blueprint, blueprint)) {
        blueprint = incoming.blueprint!;
        changed++;
      }
      const days = { ...cur.days };
      for (const [date, day] of Object.entries(incoming.days ?? {})) {
        if (!newer(day, days[date])) continue;
        days[date] = day;
        changed++;
      }
      if (changed) commit({ blueprint, days });
      return changed;
    },
    [commit],
  );

  const snapshot = useCallback(() => dataRef.current, []);

  const value = useMemo<GrowthValue>(
    () => ({ ready, data, getDay, updateBlueprint, updateDay, mergeGrowth, snapshot }),
    [ready, data, getDay, updateBlueprint, updateDay, mergeGrowth, snapshot],
  );
  return <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>;
}

export function useGrowth(): GrowthValue {
  const ctx = useContext(GrowthContext);
  if (!ctx) throw new Error('useGrowth must be used inside GrowthProvider');
  return ctx;
}
