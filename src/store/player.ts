// SONORA player store — playback state + engine glue.
// The HTMLAudioElement lives in audio/engine.ts; this store holds UI-facing state.

import { create } from 'zustand';
import type { Track } from '../types/music';
import { lsGet, lsSet } from '../services/db';
import { engine } from '../audio/engine';
import { resolvePlayUrl } from './library';
import { useLibrary } from './library';
import { fetchJamendoFresh } from '../services/jamendo';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  current: Track | null;
  queue: Track[];
  index: number;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  expanded: boolean;
  queueOpen: boolean;
  error: string | null; // i18n key or message
  loading: boolean;

  playContext: (tracks: Track[], startIndex?: number, shuffled?: boolean) => void;
  toggle: () => Promise<void>;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (t: Track | Track[]) => void;
  removeFromQueue: (i: number) => void;
  moveInQueue: (from: number, to: number) => void;
  selectQueueItem: (i: number) => void;
  setExpanded: (b: boolean) => void;
  setQueueOpen: (b: boolean) => void;
}

let listenStart = 0; // timestamp when playback (re)started, for real listening time

const persistPrefs = (s: Pick<PlayerState, 'volume' | 'muted' | 'shuffle' | 'repeat'>) =>
  lsSet('player', { volume: s.volume, muted: s.muted, shuffle: s.shuffle, repeat: s.repeat });

export const usePlayer = create<PlayerState>((set, get) => {
  // Engine wiring
  engine.onTime((t, d) => set({ positionSec: t, durationSec: d || get().durationSec }));
  engine.onEnd(() => advance(true));
  engine.onError(async (msg) => {
    const cur = get().current;
    // Jamendo stream links can expire → try re-resolving once.
    if (cur?.source === 'jamendo') {
      const fresh = await fetchJamendoFresh(cur.sourceId);
      if (fresh?.playUrl) {
        useLibrary.getState().updateTrack(fresh.id, { playUrl: fresh.playUrl, coverUrl: fresh.coverUrl });
        const url = await resolvePlayUrl(fresh);
        if (url) {
          engine.load(url, true);
          set({ current: fresh, error: null });
          return;
        }
      }
    }
    set({ error: msg || 'error_load', isPlaying: false });
  });

  function startTracking() { listenStart = performance.now(); }

  function flushListenTime() {
    const cur = get().current;
    if (!cur || !listenStart) return;
    const sec = (performance.now() - listenStart) / 1000;
    listenStart = 0;
    if (sec >= 5) useLibrary.getState().recordPlay(cur.id, Math.min(sec, cur.durationSec || sec));
  }

  async function loadAndPlay(track: Track, autoplay = true) {
    set({ loading: true, error: null });
    const url = await resolvePlayUrl(track);
    if (!url) {
      set({ loading: false, error: track.source === 'local' ? 'This file is no longer stored in this browser.' : 'error_load' });
      return;
    }
    engine.load(url, autoplay);
    set({ current: track, loading: false, isPlaying: autoplay });
    if (autoplay) startTracking();
  }

  function pickNextIndex(dir: 1 | -1): number | null {
    const { queue, index, shuffle, repeat } = get();
    if (!queue.length) return null;
    if (shuffle) {
      if (queue.length === 1) return repeat === 'off' ? null : 0;
      let n = index;
      while (n === index) n = Math.floor(Math.random() * queue.length);
      return n;
    }
    const n = index + dir;
    if (n >= queue.length) return repeat === 'all' ? 0 : null;
    if (n < 0) return repeat === 'all' ? queue.length - 1 : null;
    return n;
  }

  function advance(auto: boolean) {
    const s = get();
    flushListenTime();
    if (auto && s.repeat === 'one') {
      engine.seek(0);
      engine.play();
      set({ isPlaying: true });
      startTracking();
      return;
    }
    const ni = pickNextIndex(1);
    if (ni == null) {
      if (auto) { set({ isPlaying: false, positionSec: 0 }); return; }
      return;
    }
    const t = s.queue[ni];
    if (!t) return;
    set({ index: ni });
    loadAndPlay(t, true);
  }

  const prefs = lsGet('player', { volume: 0.8, muted: false, shuffle: false, repeat: 'off' as RepeatMode });
  engine.setVolume(prefs.muted ? 0 : prefs.volume);

  return {
    current: null, queue: [], index: -1,
    isPlaying: false, positionSec: 0, durationSec: 0,
    volume: prefs.volume, muted: prefs.muted, shuffle: prefs.shuffle, repeat: prefs.repeat,
    expanded: false, queueOpen: false, error: null, loading: false,

    playContext: (tracks, startIndex = 0, shuffled = false) => {
      if (!tracks.length) return;
      let queue = tracks;
      let idx = startIndex;
      if (shuffled || get().shuffle) {
        const rest = tracks.filter((_, i) => i !== startIndex);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        queue = [tracks[startIndex], ...rest];
        idx = 0;
      }
      set({ queue, index: idx });
      loadAndPlay(queue[idx], true);
    },

    toggle: async () => {
      const s = get();
      if (!s.current) {
        if (s.queue.length) { set({ index: 0 }); loadAndPlay(s.queue[0], true); }
        return;
      }
      if (s.isPlaying) {
        flushListenTime();
        engine.pause();
        set({ isPlaying: false });
      } else {
        const url = await resolvePlayUrl(s.current);
        if (!url) { set({ error: 'error_load' }); return; }
        engine.load(url, true);
        set({ isPlaying: true });
        startTracking();
      }
    },

    next: () => advance(false),
    prev: () => {
      const s = get();
      if (s.positionSec > 3) { engine.seek(0); return; }
      const pi = pickNextIndex(-1);
      if (pi == null || !s.queue[pi]) return;
      flushListenTime();
      set({ index: pi });
      loadAndPlay(s.queue[pi], true);
    },

    seek: (sec) => { engine.seek(sec); set({ positionSec: sec }); },

    setVolume: (v) => { engine.setVolume(v); set({ volume: v, muted: v === 0 }); persistPrefs(get()); },
    toggleMute: () => {
      const m = !get().muted;
      engine.setVolume(m ? 0 : get().volume);
      set({ muted: m });
      persistPrefs(get());
    },
    toggleShuffle: () => { set((s) => { const n = { ...s, shuffle: !s.shuffle }; persistPrefs(n); return { shuffle: n.shuffle }; }); },
    cycleRepeat: () => {
      set((s) => {
        const order: RepeatMode[] = ['off', 'all', 'one'];
        const r = order[(order.indexOf(s.repeat) + 1) % 3];
        const n = { ...s, repeat: r };
        persistPrefs(n);
        return { repeat: r };
      });
    },

    addToQueue: (t) =>
      set((s) => {
        const items = Array.isArray(t) ? t : [t];
        const queue = [...s.queue, ...items];
        if (!s.current) {
          setTimeout(() => { set({ index: 0 }); loadAndPlay(queue[0], false); }, 0);
        }
        return { queue };
      }),

    removeFromQueue: (i) =>
      set((s) => {
        const queue = s.queue.filter((_, idx) => idx !== i);
        let index = s.index;
        if (i < index) index--;
        else if (i === index) { index = Math.min(index, queue.length - 1); }
        return { queue, index };
      }),

    moveInQueue: (from, to) =>
      set((s) => {
        const queue = [...s.queue];
        const [m] = queue.splice(from, 1);
        queue.splice(to, 0, m);
        let { index } = s;
        if (from === index) index = to;
        else if (from < index && to >= index) index--;
        else if (from > index && to <= index) index++;
        return { queue, index };
      }),

    selectQueueItem: (i) => {
      const s = get();
      const t = s.queue[i];
      if (!t) return;
      flushListenTime();
      set({ index: i });
      loadAndPlay(t, true);
    },

    setExpanded: (b) => set({ expanded: b }),
    setQueueOpen: (b) => set({ queueOpen: b }),
  };
});
