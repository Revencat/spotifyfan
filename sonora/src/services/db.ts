// SONORA storage layer.
// - IndexedDB (idb-keyval): audio Blobs + large metadata (covers) — never localStorage.
// - localStorage: simple preferences & library index.

import { get, set, del } from 'idb-keyval';

const LS_PREFIX = 'sonora:';

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('SONORA: could not persist', key, e);
  }
}

export function lsRemove(key: string) {
  localStorage.removeItem(LS_PREFIX + key);
}

/** Audio files are stored in IndexedDB under this store */
export async function idbPutAudio(id: string, blob: Blob) {
  await set(`audio:${id}`, blob);
}

export async function idbGetAudio(id: string): Promise<Blob | undefined> {
  return (await get(`audio:${id}`)) as Blob | undefined;
}

export async function idbDelAudio(id: string) {
  await del(`audio:${id}`);
}

export async function idbEstimate(): Promise<number | null> {
  if (!navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return est.usage ?? 0;
}

export async function idbClearAll() {
  const keys = await (indexedDB as IDBFactory).databases?.().catch(() => null);
  // idb-keyval uses a single store; wipe by deleting known audio keys via caller list.
  void keys;
}
