// SONORA — unified music data model.
// Every source (local library, Jamendo, future providers) maps into Track.

export type TrackSource = 'local' | 'jamendo';

export interface Track {
  /** Unique id inside SONORA */
  id: string;
  /** Provider this track comes from */
  source: TrackSource;
  /** Stable id within that provider (file name hash, jamendo track id…) */
  sourceId: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  /** Authorized playback URL. For local tracks this is an object URL created on demand, never persisted. */
  playUrl?: string;
  /** Cover art URL when available (data URL for local embedded art, remote URL for online). */
  coverUrl?: string;
  genre?: string;
  year?: number;
  addedAt: number;
  /** Extra availability info (license, preview-only, expired link…) */
  license?: string;
  previewOnly?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  favorite: boolean;
  coverUrl?: string; // user-chosen image, otherwise generated collage
}

export interface AlbumInfo {
  key: string; // artist|album
  title: string;
  artist: string;
  coverUrl?: string;
  year?: number;
  trackIds: string[];
  addedAt: number;
}

export interface ArtistInfo {
  name: string;
  trackIds: string[];
  albumKeys: string[];
  coverUrl?: string;
}

export interface HistoryEntry {
  trackId: string;
  at: number;
  listenedSec: number;
}

export interface Toast {
  id: number;
  message: string;
  kind?: 'ok' | 'error';
}
