import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { deleteLocalPhoto } from './photos';
import { SectionKey } from './sections';

export type Entry = {
  date: string; // YYYY-MM-DD
  section: SectionKey;
  note: string;
  /** File name in local app storage. */
  photoFile: string | null;
  updatedAt: string; // ISO timestamp of the last edit; the newer side wins when merging devices
  /** Deleted entries are kept as tombstones so a merge doesn't bring them back. */
  deleted: boolean;
};

export type EntryInput = { note: string; photoFile: string | null };

export type Entries = Record<string, Entry>;

type StoreValue = {
  ready: boolean;
  entries: Entries;
  getEntry: (date: string, section: SectionKey) => Entry | undefined;
  saveEntry: (date: string, section: SectionKey, input: EntryInput) => void;
  deleteEntry: (date: string, section: SectionKey) => void;
  /** Merges entries from another device; returns how many local entries changed. */
  mergeEntries: (incoming: Entry[]) => number;
  /** The latest entries, including tombstones, even mid-render. */
  snapshot: () => Entries;
};

const ENTRIES_KEY = 'entries.v1';

export const entryKey = (date: string, section: SectionKey) => `${date}:${section}`;

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<Entries>({});
  // Mirrors `entries` so callbacks never work on a stale snapshot.
  const entriesRef = useRef<Entries>({});

  const commit = useCallback((next: Entries) => {
    entriesRef.current = next;
    setEntries(next);
    AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(ENTRIES_KEY).then((raw) => {
      if (raw) {
        entriesRef.current = JSON.parse(raw);
        setEntries(entriesRef.current);
      }
      setReady(true);
    });
  }, []);

  const saveEntry = useCallback(
    (date: string, section: SectionKey, input: EntryInput) => {
      const key = entryKey(date, section);
      const prev = entriesRef.current[key];
      if (prev?.photoFile && prev.photoFile !== input.photoFile) deleteLocalPhoto(prev.photoFile);
      commit({
        ...entriesRef.current,
        [key]: { date, section, ...input, updatedAt: new Date().toISOString(), deleted: false },
      });
    },
    [commit],
  );

  const deleteEntry = useCallback(
    (date: string, section: SectionKey) => {
      const key = entryKey(date, section);
      const prev = entriesRef.current[key];
      if (!prev) return;
      if (prev.photoFile) deleteLocalPhoto(prev.photoFile);
      commit({
        ...entriesRef.current,
        [key]: { ...prev, note: '', photoFile: null, deleted: true, updatedAt: new Date().toISOString() },
      });
    },
    [commit],
  );

  const mergeEntries = useCallback(
    (incoming: Entry[]) => {
      const next = { ...entriesRef.current };
      let changed = 0;
      for (const e of incoming) {
        const key = entryKey(e.date, e.section);
        const local = next[key];
        if (local && Date.parse(local.updatedAt) >= Date.parse(e.updatedAt)) continue;
        if (local?.photoFile && local.photoFile !== e.photoFile) deleteLocalPhoto(local.photoFile);
        next[key] = e;
        changed++;
      }
      if (changed) commit(next);
      return changed;
    },
    [commit],
  );

  const getEntry = useCallback(
    (date: string, section: SectionKey) => {
      const e = entries[entryKey(date, section)];
      return e && !e.deleted ? e : undefined;
    },
    [entries],
  );

  const snapshot = useCallback(() => entriesRef.current, []);

  const value = useMemo<StoreValue>(
    () => ({ ready, entries, getEntry, saveEntry, deleteEntry, mergeEntries, snapshot }),
    [ready, entries, getEntry, saveEntry, deleteEntry, mergeEntries, snapshot],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Non-deleted entries as a flat list. */
export function activeEntries(entries: Entries): Entry[] {
  return Object.values(entries).filter((e) => !e.deleted);
}
