// SONORA library store — tracks, playlists, favorites, history.
// Index persisted in localStorage; audio blobs in IndexedDB.

import { create } from 'zustand';
import type { Track, Playlist, AlbumInfo, ArtistInfo, HistoryEntry } from '../types/music';
import { lsGet, lsSet, idbPutAudio, idbDelAudio, idbGetAudio } from '../services/db';
import { generateCover } from '../services/artwork';
import { analyzeAudioFile, makeLocalTrack } from '../services/metadata';

interface LibraryState {
  tracks: Record<string, Track>;
  playlists: Playlist[];
  favorites: string[]; // track ids
  followedArtists: string[];
  history: HistoryEntry[];
  downloadedIds: string[]; // local tracks explicitly kept (already in IDB) — flag for Downloads page
  hydrated: boolean;

  hydrate: () => void;
  importFiles: (files: File[]) => Promise<{ added: Track[]; failed: number }>;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  toggleFavorite: (id: string) => void;
  toggleFollowArtist: (name: string) => void;
  toggleDownloaded: (id: string) => void;
  addJamendoToLibrary: (t: Track) => void;

  createPlaylist: (name: string, description?: string) => Playlist;
  updatePlaylist: (id: string, patch: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, index: number) => void;
  reorderPlaylist: (playlistId: string, from: number, to: number) => void;

  recordPlay: (trackId: string, listenedSec: number) => void;
  clearHistory: () => void;
  wipeAll: () => Promise<void>;

  albums: () => AlbumInfo[];
  artists: () => ArtistInfo[];
  getAlbum: (key: string) => AlbumInfo | undefined;
  getArtist: (name: string) => ArtistInfo | undefined;
}

const persist = (s: LibraryState) => {
  // Tracks: strip transient playUrl before persisting
  const slim: Record<string, Track> = {};
  for (const [k, v] of Object.entries(s.tracks)) slim[k] = { ...v, playUrl: undefined };
  lsSet('tracks', slim);
  lsSet('playlists', s.playlists);
  lsSet('favorites', s.favorites);
  lsSet('followed', s.followedArtists);
  lsSet('history', s.history.slice(-400));
  lsSet('downloaded', s.downloadedIds);
};

export const useLibrary = create<LibraryState>((set, get) => ({
  tracks: {},
  playlists: [],
  favorites: [],
  followedArtists: [],
  history: [],
  downloadedIds: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({
      tracks: lsGet('tracks', {}),
      playlists: lsGet('playlists', [] as Playlist[]),
      favorites: lsGet('favorites', [] as string[]),
      followedArtists: lsGet('followed', [] as string[]),
      history: lsGet('history', [] as HistoryEntry[]),
      downloadedIds: lsGet('downloaded', [] as string[]),
      hydrated: true,
    });
  },

  importFiles: async (files) => {
    const added: Track[] = [];
    let failed = 0;
    for (const f of files) {
      try {
        const { meta } = await analyzeAudioFile(f);
        const track = makeLocalTrack(meta, f.name, f.size);
        if (!track.coverUrl) track.coverUrl = generateCover(`${track.title}|${track.artist}`);
        await idbPutAudio(track.id, f); // audio blob stays on this device
        added.push(track);
      } catch (e) {
        console.warn('SONORA import failed for', f.name, e);
        failed++;
      }
    }
    if (added.length) {
      set((s) => {
        const tracks = { ...s.tracks };
        added.forEach((t) => (tracks[t.id] = t));
        const next = { ...s, tracks };
        persist(next);
        return { tracks };
      });
    }
    return { added, failed };
  },

  removeTrack: (id) => {
    set((s) => {
      const tracks = { ...s.tracks };
      delete tracks[id];
      const next = {
        ...s, tracks,
        favorites: s.favorites.filter((f) => f !== id),
        downloadedIds: s.downloadedIds.filter((d) => d !== id),
        playlists: s.playlists.map((p) => ({ ...p, trackIds: p.trackIds.filter((t) => t !== id) })),
      };
      persist(next);
      return next;
    });
    if (id.startsWith('local-')) idbDelAudio(id).catch(() => {});
  },

  updateTrack: (id, patch) =>
    set((s) => {
      const cur = s.tracks[id];
      if (!cur) return s;
      const tracks = { ...s.tracks, [id]: { ...cur, ...patch } };
      persist({ ...s, tracks });
      return { tracks };
    }),

  toggleFavorite: (id) =>
    set((s) => {
      const favorites = s.favorites.includes(id)
        ? s.favorites.filter((f) => f !== id)
        : [...s.favorites, id];
      persist({ ...s, favorites });
      return { favorites };
    }),

  toggleFollowArtist: (name) =>
    set((s) => {
      const followedArtists = s.followedArtists.includes(name)
        ? s.followedArtists.filter((f) => f !== name)
        : [...s.followedArtists, name];
      persist({ ...s, followedArtists });
      return { followedArtists };
    }),

  toggleDownloaded: (id) =>
    set((s) => {
      const downloadedIds = s.downloadedIds.includes(id)
        ? s.downloadedIds.filter((d) => d !== id)
        : [...s.downloadedIds, id];
      persist({ ...s, downloadedIds });
      return { downloadedIds };
    }),

  addJamendoToLibrary: (t) =>
    set((s) => {
      const tracks = { ...s.tracks, [t.id]: { ...t, addedAt: Date.now() } };
      persist({ ...s, tracks });
      return { tracks };
    }),

  createPlaylist: (name, description) => {
    const pl: Playlist = {
      id: `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name, description, trackIds: [], createdAt: Date.now(), favorite: false,
    };
    set((s) => {
      const playlists = [pl, ...s.playlists];
      persist({ ...s, playlists });
      return { playlists };
    });
    return pl;
  },

  updatePlaylist: (id, patch) =>
    set((s) => {
      const playlists = s.playlists.map((p) => (p.id === id ? { ...p, ...patch } : p));
      persist({ ...s, playlists });
      return { playlists };
    }),

  deletePlaylist: (id) =>
    set((s) => {
      const playlists = s.playlists.filter((p) => p.id !== id);
      persist({ ...s, playlists });
      return { playlists };
    }),

  addToPlaylist: (playlistId, trackId) =>
    set((s) => {
      const playlists = s.playlists.map((p) =>
        p.id === playlistId && !p.trackIds.includes(trackId)
          ? { ...p, trackIds: [...p.trackIds, trackId] }
          : p,
      );
      persist({ ...s, playlists });
      return { playlists };
    }),

  removeFromPlaylist: (playlistId, index) =>
    set((s) => {
      const playlists = s.playlists.map((p) =>
        p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((_, i) => i !== index) } : p,
      );
      persist({ ...s, playlists });
      return { playlists };
    }),

  reorderPlaylist: (playlistId, from, to) =>
    set((s) => {
      const playlists = s.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        const ids = [...p.trackIds];
        const [moved] = ids.splice(from, 1);
        ids.splice(to, 0, moved);
        return { ...p, trackIds: ids };
      });
      persist({ ...s, playlists });
      return { playlists };
    }),

  recordPlay: (trackId, listenedSec) =>
    set((s) => {
      const history = [...s.history, { trackId, at: Date.now(), listenedSec: Math.round(listenedSec) }].slice(-400);
      persist({ ...s, history });
      return { history };
    }),

  clearHistory: () =>
    set((s) => {
      persist({ ...s, history: [] });
      return { history: [] };
    }),

  wipeAll: async () => {
    const s = get();
    for (const id of Object.keys(s.tracks)) {
      if (id.startsWith('local-')) await idbDelAudio(id).catch(() => {});
    }
    ['tracks', 'playlists', 'favorites', 'followed', 'history', 'downloaded'].forEach(lsRemoveKey);
    set({ tracks: {}, playlists: [], favorites: [], followedArtists: [], history: [], downloadedIds: [] });
  },

  albums: () => {
    const map = new Map<string, AlbumInfo>();
    for (const t of Object.values(get().tracks)) {
      if (!t.album || t.album === 'Singles') continue;
      const key = `${t.artist}|${t.album}`;
      const a = map.get(key) ?? { key, title: t.album, artist: t.artist, coverUrl: t.coverUrl, year: t.year, trackIds: [], addedAt: t.addedAt };
      a.trackIds.push(t.id);
      a.addedAt = Math.min(a.addedAt, t.addedAt);
      map.set(key, a);
    }
    return [...map.values()].sort((a, b) => b.addedAt - a.addedAt);
  },

  artists: () => {
    const map = new Map<string, ArtistInfo>();
    for (const t of Object.values(get().tracks)) {
      const a = map.get(t.artist) ?? { name: t.artist, trackIds: [], albumKeys: [], coverUrl: t.coverUrl };
      a.trackIds.push(t.id);
      if (t.album && t.album !== 'Singles') {
        const k = `${t.artist}|${t.album}`;
        if (!a.albumKeys.includes(k)) a.albumKeys.push(k);
      }
      map.set(t.artist, a);
    }
    return [...map.values()].sort((x, y) => x.name.localeCompare(y.name));
  },

  getAlbum: (key) => get().albums().find((a) => a.key === key),
  getArtist: (name) => get().artists().find((a) => a.name === name),
}));

function lsRemoveKey(k: string) {
  localStorage.removeItem('sonora:' + k);
}

/** Resolve a playable URL for any track (creates object URL for local blobs). */
const objectUrlCache = new Map<string, string>();
export async function resolvePlayUrl(track: Track): Promise<string | null> {
  if (track.source === 'local') {
    const cached = objectUrlCache.get(track.id);
    if (cached) return cached;
    const blob = await idbGetAudio(track.id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(track.id, url);
    return url;
  }
  return track.playUrl ?? null;
}
