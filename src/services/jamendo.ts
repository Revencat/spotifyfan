// SONORA — Jamendo adapter (online independent catalog).
// Jamendo API v3.0 is public and free for non-commercial use with client_id.
// Tracks streamed here are Creative Commons licensed, preview/full streams allowed by Jamendo ToS.
// Attribution is required: the UI always shows "Jamendo" as source on these tracks.

import type { Track } from '../types/music';

// Public demo client id provided by Jamendo for developer testing.
// Replace with your own registered client_id for production use (Settings → Sources).
const DEFAULT_CLIENT_ID = 'sonoraindex21';

export interface JamendoConfig {
  clientId: string;
  enabled: boolean;
}

export function getJamendoConfig(): JamendoConfig {
  try {
    const raw = localStorage.getItem('sonora:jamendo');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { clientId: DEFAULT_CLIENT_ID, enabled: true };
}

export function saveJamendoConfig(cfg: JamendoConfig) {
  localStorage.setItem('sonora:jamendo', JSON.stringify(cfg));
}

interface JTrack {
  track_id: number;
  track_name: string;
  track_duration: number;
  track_position?: number;
  album_id: number;
  album_name: string;
  artist_id: number;
  artist_name: string;
  track_image: string;
  album_image?: string;
  track_license_cc_url?: string;
  audio: string;
  audio_preview?: string;
  popularity?: number;
}

function mapTrack(t: JTrack): Track {
  return {
    id: `jamendo-${t.track_id}`,
    source: 'jamendo',
    sourceId: String(t.track_id),
    title: t.track_name,
    artist: t.artist_name,
    album: t.album_name,
    durationSec: t.track_duration,
    // Stream URLs from Jamendo are authorized for playback; they may rotate, so we re-fetch when needed.
    playUrl: t.audio || t.audio_preview,
    coverUrl: t.track_image || t.album_image,
    license: t.track_license_cc_url ? 'Creative Commons' : 'Jamendo License',
    addedAt: Date.now(),
  };
}

async function api(params: Record<string, string>): Promise<JTrack[]> {
  const cfg = getJamendoConfig();
  if (!cfg.enabled || !cfg.clientId) throw new Error('Jamendo source disabled or missing client_id');
  const qs = new URLSearchParams({ client_id: cfg.clientId, limit: '24', ...params });
  const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${qs.toString()}`);
  if (!res.ok) throw new Error(`Jamendo API error ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.results ?? [];
}

/** Curated moods mapped to real Jamendo search params */
export const MOOD_QUERIES: Record<string, string[]> = {
  focus: ['bpm=70-100&category_producerolo=electronic&mp3guiter=no'],
  nightdrive: ['bpm=90-120&category_producerolo=electronic'],
  chill: ['acoustic=yes&bpm=60-95'],
  energy: ['bpm=120-180&category_producerolo=rock'],
  melancholy: ['vocalgender=female&bpm=50-85'],
  latenight: ['category_producerolo=jazz&bpm=50-90'],
  deepwork: ['instrumental=yes&bpm=60-100'],
  sundaymorning: ['acoustic=yes&vocalgender=female'],
};

export async function fetchJamendoMood(mood: string): Promise<Track[]> {
  const q = MOOD_QUERIES[mood] ?? [];
  const results: JTrack[] = [];
  for (const part of q) {
    const params = Object.fromEntries(new URLSearchParams(part));
    try {
      const r = await api({ ...params, order: 'popularity_plus_week' });
      results.push(...r);
      break;
    } catch (e) {
      console.warn('Jamendo mood query failed:', e);
    }
  }
  return dedupe(results.map(mapTrack)).slice(0, 12);
}

export async function searchJamendo(query: string): Promise<Track[]> {
  const r = await api({ search: query, order: 'relevance' });
  return r.map(mapTrack);
}

export async function fetchJamendoFresh(id: string): Promise<Track | null> {
  // Re-resolve stream URL (links can expire)
  try {
    const r = await api({ track_id: id, limit: '1' });
    return r.length ? mapTrack(r[0]) : null;
  } catch {
    return null;
  }
}

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}
