import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as auth from './auth';
import {
  deleteFile,
  downloadPhotoFile,
  listFiles,
  readJson,
  setInteractive,
  uploadPhotoFile,
  writeJson,
} from './drive';
import { hasPhoto } from './photos';
import { isSectionKey } from './sections';
import { Entry, useStore } from './store';

// Sync model: Drive holds one entries.json (every entry, including deletions)
// plus one file per photo. Each sync downloads it, merges it into the local
// store (newer edit wins per day+section), then uploads the merged result.

const ENTRIES_FILE = 'entries.json';
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

type RemoteData = { version: 1; entries: Entry[] };

export type SyncStatus = {
  /** needsAuth: on the web, the Google token expired and a click is needed to continue. */
  state: 'idle' | 'syncing' | 'error' | 'needsAuth';
  lastSyncedAt: Date | null;
  error?: string;
};

type SyncValue = {
  /** False where Google sign-in can't work (Expo Go, or web without a client ID). */
  available: boolean;
  user: auth.GoogleUser | null;
  status: SyncStatus;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** interactive: called from a button, so the web version may show Google's popup. */
  syncNow: (options?: { interactive?: boolean }) => Promise<void>;
};

const SyncContext = createContext<SyncValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { ready, entries, mergeEntries, snapshot } = useStore();
  const [user, setUser] = useState<auth.GoogleUser | null>(null);
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle', lastSyncedAt: null });
  const running = useRef(false);

  useEffect(() => {
    if (!auth.authAvailable) return;
    auth
      .restoreSession()
      .then(setUser)
      .catch(() => {});
  }, []);

  const syncNow = useCallback(
    async ({ interactive = false }: { interactive?: boolean } = {}) => {
      if (!user || running.current) return;
      running.current = true;
      setInteractive(interactive);
      setStatus((s) => ({ ...s, state: 'syncing', error: undefined }));
      try {
        const files = await listFiles();
        const byName = new Map(files.map((f) => [f.name, f]));

        // 1. Pull: fetch photos for remote entries, then merge.
        const remoteFile = byName.get(ENTRIES_FILE);
        if (remoteFile) {
          const remote = await readJson<RemoteData>(remoteFile.id);
          const incoming = (remote.entries ?? []).filter((e) => isSectionKey(e.section));
          for (const e of incoming) {
            if (e.deleted || !e.photoFile) continue;
            const remotePhoto = byName.get(e.photoFile);
            if (remotePhoto && !(await hasPhoto(e.photoFile))) await downloadPhotoFile(remotePhoto.id, e.photoFile);
          }
          mergeEntries(incoming);
        }

        // 2. Push photos first, so other devices never see an entry before its photo.
        const merged = Object.values(snapshot());
        const referenced = new Set<string>();
        for (const e of merged) {
          if (e.deleted || !e.photoFile) continue;
          referenced.add(e.photoFile);
          if (!byName.has(e.photoFile) && (await hasPhoto(e.photoFile))) await uploadPhotoFile(e.photoFile);
        }
        const data: RemoteData = { version: 1, entries: merged };
        await writeJson(ENTRIES_FILE, data, remoteFile?.id);

        // 3. Clean up photos no entry uses any more. The grace period protects a
        // photo another device has just uploaded but not yet referenced.
        const now = Date.now();
        for (const f of files) {
          if (f.name === ENTRIES_FILE || referenced.has(f.name)) continue;
          if (now - Date.parse(f.modifiedTime) > ORPHAN_GRACE_MS) await deleteFile(f.id);
        }

        setStatus({ state: 'idle', lastSyncedAt: new Date() });
      } catch (err) {
        if (err instanceof auth.NeedsSignInError) setStatus((s) => ({ ...s, state: 'needsAuth' }));
        else setStatus((s) => ({ ...s, state: 'error', error: err instanceof Error ? err.message : String(err) }));
      } finally {
        running.current = false;
        setInteractive(false);
      }
    },
    [user, mergeEntries, snapshot],
  );

  // Sync when signed in, when the app returns to the foreground, and shortly after edits.
  useEffect(() => {
    if (!ready || !user) return;
    syncNow();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    return () => sub.remove();
  }, [ready, user, syncNow]);

  const firstEntries = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (firstEntries.current) {
      firstEntries.current = false;
      return;
    }
    const t = setTimeout(() => syncNow(), 3000);
    return () => clearTimeout(t);
    // syncNow is intentionally left out: only local edits should schedule a sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, ready]);

  const signIn = useCallback(async () => {
    const signedIn = await auth.signIn();
    if (signedIn) setUser(signedIn);
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setStatus({ state: 'idle', lastSyncedAt: null });
  }, []);

  const value = useMemo(
    () => ({ available: auth.authAvailable, user, status, signIn, signOut, syncNow }),
    [user, status, signIn, signOut, syncNow],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}
