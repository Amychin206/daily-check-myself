import { useEffect, useState } from 'react';

// Browser photo storage: blobs in IndexedDB, keyed by the same file names the
// phone uses, so entries and sync work identically on both.

const DB_NAME = 'daily-check-myself';
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const store = (await db()).transaction(STORE, mode).objectStore(STORE);
  return new Promise((resolve, reject) => {
    const req = run(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const getBlob = (name: string) => tx<Blob | undefined>('readonly', (s) => s.get(name));
const putBlob = (name: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, name));

export function newPhotoName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

export async function persistPhoto(sourceUri: string): Promise<string> {
  const name = newPhotoName();
  await putBlob(name, await (await fetch(sourceUri)).blob());
  return name;
}

export function deleteLocalPhoto(name: string) {
  tx('readwrite', (s) => s.delete(name)).catch(() => {});
}

export async function hasPhoto(name: string): Promise<boolean> {
  return (await getBlob(name)) !== undefined;
}

export async function readPhoto(name: string): Promise<Uint8Array> {
  const blob = await getBlob(name);
  if (!blob) throw new Error(`找不到照片 ${name}`);
  return new Uint8Array(await blob.arrayBuffer());
}

export async function writePhoto(name: string, bytes: Uint8Array): Promise<void> {
  await putBlob(name, new Blob([bytes as BlobPart], { type: 'image/jpeg' }));
}

export function usePhotoUri(name: string): string | null {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    getBlob(name).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setUri(url);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setUri(null);
    };
  }, [name]);
  return uri;
}

export async function uploadPhoto(name: string, url: string, headers: Record<string, string>): Promise<number> {
  const blob = await getBlob(name);
  if (!blob) throw new Error(`找不到照片 ${name}`);
  const res = await fetch(url, { method: 'PATCH', headers, body: blob });
  return res.status;
}

export async function downloadPhoto(url: string, headers: Record<string, string>, name: string): Promise<void> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`照片下载失败（${res.status}）`);
  await putBlob(name, await res.blob());
}
