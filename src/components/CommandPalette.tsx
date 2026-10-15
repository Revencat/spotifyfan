// SONORA — global search overlay (Ctrl/Cmd+K). Instant results across local library + online source.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, Loader2 } from 'lucide-react';
import { useUi } from '../store/ui';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useT } from '../i18n';
import type { Track } from '../types/music';
import { Cover, SourceBadge, EmptyState, Btn } from './ui';
import { Link } from '../router';
import { searchJamendo } from '../services/jamendo';
import { fmtTime } from '../utils/format';

type Filter = 'all' | 'tracks' | 'artists' | 'albums' | 'playlists';

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPalette);
  const lib = useLibrary();
  const player = usePlayer();
  const { t } = useT();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [online, setOnline] = useState<Track[] | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<number>(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUi.getState().paletteOpen);
      } else if (e.key === 'Escape') setOpen(false);
      // media keys style shortcuts only when not typing
      if (!typing && document.querySelector('dialog,input:focus') == null) {
        if (e.key === ' ' && usePlayer.getState().current) { e.preventDefault(); usePlayer.getState().toggle(); }
        if (e.key === 'ArrowRight' && e.mediaKeySupported !== false && e.shiftKey) usePlayer.getState().next();
        if (e.key === 'ArrowLeft' && e.shiftKey) usePlayer.getState().prev();
      }
      void typing;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); else { setQ(''); setOnline(null); setFilter('all'); } }, [open]);

  // online search with debounce
  useEffect(() => {
    if (!open || q.trim().length < 2) { setOnline(null); return; }
    setSearching(true);
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(async () => {
      try {
        const r = await searchJamendo(q.trim());
        setOnline(r);
      } catch {
        setOnline([]);
      } finally {
        setSearching(false);
      }
    }, 550);
    return () => window.clearTimeout(debounce.current);
  }, [q, open]);

  const localTracks = useMemo(() => {
    const all = Object.values(lib.tracks);
    if (!q.trim()) return all.slice(0, 8);
    const lq = q.toLowerCase();
    return all.filter((tr) => `${tr.title} ${tr.artist} ${tr.album}`.toLowerCase().includes(lq)).slice(0, 12);
  }, [lib.tracks, q]);

  const matchedArtists = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return lib.artists().filter((a) => a.name.toLowerCase().includes(lq)).slice(0, 5);
  }, [lib, q]);

  const matchedAlbums = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return lib.albums().filter((a) => `${a.title} ${a.artist}`.toLowerCase().includes(lq)).slice(0, 5);
  }, [lib, q]);

  const matchedPlaylists = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return lib.playlists.filter((p) => p.name.toLowerCase().includes(lq)).slice(0, 5);
  }, [lib.playlists, q]);

  const showType = (f: Filter) => filter === 'all' || filter === f;
  const hasAny = localTracks.length + matchedArtists.length + matchedAlbums.length + matchedPlaylists.length + (online?.length ?? 0) > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm pt-[10vh] pb-4 px-4 flex justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <motion.div
            initial={{ scale: 0.96, y: -10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: -8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="surface-raised border rounded-2xl shadow-pop w-full max-w-2xl h-fit max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-edge">
              <Search size={18} className="text-mute shrink-0" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={t('search_placeholder')} aria-label={t('nav_search')}
                className="flex-1 bg-transparent py-3.5 outline-none text-sm placeholder:text-mute/60" />
              {searching && <Loader2 size={15} className="animate-spin text-mute shrink-0" />}
              <button onClick={() => setOpen(false)} aria-label={t('close')} className="text-mute hover:text-ink p-1"><X size={16} /></button>
            </div>
            <div className="flex gap-1.5 px-4 py-2.5 border-b border-edge/60 overflow-x-auto no-scrollbar">
              {(['all', 'tracks', 'artists', 'albums', 'playlists'] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-lime text-black' : 'surface-panel border text-mute hover:text-ink'}`}>
                  {t(f === 'all' ? 'search_all' : f === 'tracks' ? 'tracks' : f === 'artists' ? 'artists_t' : f === 'albums' ? 'albums_t' : 'playlists_t')}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto p-2 flex-1">
              {!hasAny && q.trim() ? (
                <EmptyState icon={<Search size={32} />} title={t('no_results_title')} sub={t('no_results_sub')}
                  action={<Btn small onClick={() => setQ('')}>{t('clear_search')}</Btn>} />
              ) : (
                <>
                  {showType('tracks') && localTracks.length > 0 && <Section label={t('source_local') + ' · ' + t('tracks')}>
                    {localTracks.map((tr) => (
                      <Row key={tr.id} track={tr} onPlay={() => { player.playContext(localTracks, localTracks.indexOf(tr)); setOpen(false); }} onOpen={() => setOpen(false)} />
                    ))}
                  </Section>}
                  {showType('tracks') && online && online.length > 0 && <Section label={t('source_jamendo')}>
                    {online.slice(0, 8).map((tr) => (
                      <Row key={tr.id} track={tr} onPlay={() => { player.playContext(online, online.indexOf(tr)); setOpen(false); }} onOpen={() => setOpen(false)} />
                    ))}
                  </Section>}
                  {showType('artists') && matchedArtists.map((a) => (
                    <Link key={a.name} to={`/artist/${encodeURIComponent(a.name)}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-raised text-sm">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-violet/50 to-electric/40 grid place-items-center text-[10px] font-bold">{a.name[0]}</span>
                      <span className="font-medium">{a.name}</span><span className="text-xs text-mute ml-auto">{a.trackIds.length} {t('total_tracks')}</span>
                    </Link>
                  ))}
                  {showType('albums') && matchedAlbums.map((a) => (
                    <Link key={a.key} to={`/album/${encodeURIComponent(a.key)}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-raised text-sm">
                      <Cover track={lib.tracks[a.trackIds[0]]} size={32} />
                      <span className="font-medium truncate">{a.title}</span><span className="text-xs text-mute ml-auto truncate">{a.artist}</span>
                    </Link>
                  ))}
                  {showType('playlists') && matchedPlaylists.map((p) => (
                    <Link key={p.id} to={`/playlist/${p.id}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-raised text-sm">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime/40 to-violet/40 grid place-items-center text-xs">♪</span>
                      <span className="font-medium truncate">{p.name}</span><span className="text-xs text-mute ml-auto">{p.trackIds.length} {t('total_tracks')}</span>
                    </Link>
                  ))}
                  {!q.trim() && <p className="text-xs text-mute px-3 py-2">{t('tagline')} — {t('source_local')} + {t('source_jamendo')}</p>}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-mute/70">{label}</div>
      {children}
    </div>
  );
}

function Row({ track, onPlay, onOpen }: { track: Track; onPlay: () => void; onOpen: () => void }) {
  const addToQueue = usePlayer((s) => s.addToQueue);
  const { t } = useT();
  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-raised cursor-pointer" onClick={onPlay}>
      <Cover track={track} size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate flex items-center gap-2">{track.title}<SourceBadge track={track} /></div>
        <div className="text-xs text-mute truncate">{track.artist} · {track.album}</div>
      </div>
      <span className="text-xs text-mute tabular-nums">{fmtTime(track.durationSec)}</span>
      <button
        aria-label={t('add_to_queue')}
        onClick={(e) => { e.stopPropagation(); addToQueue(track); onOpen(); }}
        className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-lime border border-lime/40 rounded-full px-2 py-1 hover:bg-lime/10 transition-all shrink-0"
      >+Q</button>
    </div>
  );
}
