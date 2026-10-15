// SONORA — Home: welcome, continue listening, mood playlists, discovery, rotation, recently added.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Music2, ListMusic } from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { usePrefs } from '../store/prefs';
import { useUi } from '../store/ui';
import { useT } from '../i18n';
import { greetingKey, fmtTime } from '../utils/format';
import { Reveal, SectionTitle, MediaCard, Shelf } from '../components/browse/common';
import { EmptyState, Btn, Cover } from '../components/ui';
import { useTrackMenuOpener } from '../components/trackMenu';
import { fetchJamendoMood } from '../services/jamendo';
import type { Track } from '../types/music';
import { useRouter } from '../router';

const MOODS = [
  { key: 'mood_focus', q: 'focus', desc: 'Steady instrumentals to hold your attention.' },
  { key: 'mood_nightdrive', q: 'nightdrive', desc: 'Neon-lit electronic routes for empty roads.' },
  { key: 'mood_chill', q: 'chill', desc: 'Soft textures, low gravity.' },
  { key: 'mood_energy', q: 'energy', desc: 'Fast tempo, brighter colors.' },
  { key: 'mood_melancholy', q: 'melancholy', desc: 'For rainy windows and long thoughts.' },
  { key: 'mood_latenight', q: 'latenight', desc: 'Warm notes after midnight.' },
  { key: 'mood_deepwork', q: 'deepwork', desc: 'Minimal sound, maximum flow.' },
  { key: 'mood_sunday', q: 'sunday', desc: 'Acoustic light through curtains.' },
] as const;

export function HomePage() {
  const { t } = useT();
  const lib = useLibrary();
  const player = usePlayer();
  const username = usePrefs((s) => s.username);
  const toast = useUi((s) => s.pushToast);
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [moods, setMoods] = useState<Record<string, Track[]>>({});
  const [moodLoading, setMoodLoading] = useState(false);

  // Load one mood shelf lazily when home opens (real Jamendo requests).
  useEffect(() => {
    let alive = true;
    const load = async () => {
      setMoodLoading(true);
      const out: Record<string, Track[]> = {};
      try {
        const picks = ['focus', 'nightdrive', 'chill'];
        await Promise.all(picks.map(async (m) => {
          try { out[m] = await fetchJamendoMood(m); } catch { out[m] = []; }
        }));
      } catch {}
      if (alive) { setMoods(out); setMoodLoading(false); }
    };
    load();
    return () => { alive = false; };
  }, []);

  const allTracks = Object.values(lib.tracks);

  const recentIds = useMemo(() => {
    const seen: string[] = [];
    for (let i = lib.history.length - 1; i >= 0 && seen.length < 6; i--) {
      const id = lib.history[i].trackId;
      if (lib.tracks[id] && !seen.includes(id)) seen.push(id);
    }
    return seen;
  }, [lib.history, lib.tracks]);

  const rotation = useMemo(() => {
    const count = new Map<string, number>();
    for (const h of lib.history) count.set(h.trackId, (count.get(h.trackId) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id]) => lib.tracks[id]).filter(Boolean);
  }, [lib.history, lib.tracks]);

  const recentlyAdded = useMemo(
    () => [...allTracks].sort((a, b) => b.addedAt - a.addedAt).slice(0, 10),
    [allTracks],
  );

  const onImport = async (files: FileList | null) => {
    if (!files?.length) return;
    const res = await lib.importFiles(Array.from(files));
    if (res.added.length) toast(`${res.added.length} ${t('tracks').toLowerCase()} ✓${res.failed ? ` · ${res.failed} ✕` : ''}`);
    else if (res.failed) toast(t('error_load'), 'error');
  };

  const moodCards = MOODS.slice(0, 4).map((m) => ({ ...m, tracks: moods[m.q] ?? [] }));

  return (
    <div className="px-4 md:px-6 py-6 space-y-2">
      {/* Welcome */}
      <Reveal>
        <div className="mb-8">
          <p className="text-mute text-sm font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1">
            {t(greetingKey())}{username ? `, ${username}` : ''}.
          </h1>
          <p className="text-mute mt-1">{t('welcome_sub')} <span className="text-lime/80">{t('taglineAlt')}</span></p>
        </div>
      </Reveal>

      {/* Continue listening */}
      {recentIds.length > 0 && (
        <Reveal>
          <SectionTitle title={t('continue_listening')} />
          <Shelf>
            {recentIds.map((id) => {
              const tr = lib.tracks[id];
              return <MediaCard key={id} track={tr} label={tr.title} sub={tr.artist} contextTracks={recentIds.map((i) => lib.tracks[i]).filter(Boolean)} />;
            })}
          </Shelf>
        </Reveal>
      )}

      {/* Made for your mood */}
      <Reveal delay={0.05}>
        <SectionTitle title={t('made_for_mood')} action={<span className="text-[11px] text-mute hidden sm:inline">Jamendo · Creative Commons</span>} />
        {moodLoading && Object.keys(moods).length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square rounded-xl bg-raised animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {moodCards.map((m) => (
              <MoodTile key={m.key} name={t(m.key)} desc={m.desc} tracks={m.tracks}
                loading={!m.tracks.length && moodLoading}
                onPlay={() => {
                  if (m.tracks.length) player.playContext(m.tracks, 0, true);
                  else toast('No online results right now — check your connection.', 'error');
                }} />
            ))}
          </div>
        )}
      </Reveal>

      {/* Discover something new */}
      <Reveal delay={0.08}>
        <SectionTitle title={t('discover_new')} action={<Btn small onClick={() => navigate('/explore')}>{t('explore_catalog')}</Btn>} />
        {allTracks.length === 0 ? (
          <EmptyState icon={<Music2 size={34} />} title={t('library_empty_title')} sub={t('library_empty_sub')}
            action={<>
              <Btn primary onClick={() => fileRef.current?.click()}><Upload size={15} />{t('import_music')}</Btn>
              <Btn onClick={() => navigate('/explore')}>{t('explore_catalog')}</Btn>
            </>} />
        ) : (
          <Shelf>
            {recentlyAdded.slice(0, 5).map((tr) => (
              <MediaCard key={tr.id} track={tr} label={tr.title} sub={`${tr.artist} · ${tr.album}`} contextTracks={recentlyAdded} />
            ))}
          </Shelf>
        )}
      </Reveal>

      {/* Your rotation (real history) */}
      {rotation.length > 0 && (
        <Reveal delay={0.1}>
          <SectionTitle title={t('your_rotation')} />
          <Shelf>
            {rotation.map((tr) => (
              <MediaCard key={tr.id} track={tr} label={tr.title} sub={tr.artist} contextTracks={rotation} />
            ))}
          </Shelf>
        </Reveal>
      )}

      {/* Recently added list */}
      {recentlyAdded.length > 0 && (
        <Reveal delay={0.12}>
          <SectionTitle title={t('recently_added')} action={<Btn small onClick={() => navigate('/library')}><ListMusic size={13} />{t('nav_library')}</Btn>} />
          <div className="surface-panel border rounded-2xl p-2 overflow-hidden">
            {recentlyAdded.slice(0, 6).map((tr) => (
              <TrackLine key={tr.id} track={tr} />
            ))}
          </div>
        </Reveal>
      )}

      <input ref={fileRef} type="file" accept=".mp3,.wav,.ogg,.flac,audio/*" multiple hidden onChange={(e) => onImport(e.target.files)} />
    </div>
  );
}

function MoodTile({ name, desc, tracks, onPlay, loading }: { name: string; desc: string; tracks: Track[]; onPlay: () => void; loading?: boolean }) {
  const player = usePlayer();
  const cover = tracks[0]?.coverUrl;
  return (
    <div className="relative group rounded-xl overflow-hidden surface-raised border card-hover min-h-[110px] flex flex-col justify-between p-3.5 cursor-pointer" onClick={onPlay}>
      {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-45 transition-opacity" />}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/70" />
      <div className="relative">
        <h3 className="font-extrabold text-lg">{name}</h3>
        <p className="text-[11px] text-white/70 mt-0.5 line-clamp-2">{desc}</p>
      </div>
      <div className="relative flex items-center justify-between mt-3">
        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
          {loading ? '…' : tracks.length ? `${tracks.length} tracks · Jamendo` : ''}
        </span>
        <button aria-label={`Play ${name}`} onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="w-9 h-9 rounded-full bg-lime text-black grid place-items-center translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5c0-1.1 1.2-1.8 2.1-1.2l11 7.5c1 .7 1 2.2 0 2.9l-11 7.5c-.9.6-2.1-.1-2.1-1.2V4.5z"/></svg>
        </button>
      </div>
    </div>
  );
}

function TrackLine({ track }: { track: Track }) {
  const player = usePlayer();
  const openMenu = useTrackMenuOpener();
  const active = player.current?.id === track.id;
  return (
    <div
      className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-raised transition-colors cursor-pointer"
      onClick={() => player.playContext([track])}
      onContextMenu={(e) => openMenu(e, track)}
    >
      <Cover track={track} size={40} />
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-semibold truncate ${active ? 'text-lime' : ''}`}>{track.title}</div>
        <div className="text-xs text-mute truncate">{track.artist} · {track.album}</div>
      </div>
      <span className="text-xs text-mute tabular-nums">{fmtTime(track.durationSec)}</span>
    </div>
  );
}
