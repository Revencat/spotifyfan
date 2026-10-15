// SONORA — persistent bottom player (desktop) + compact mini-player (mobile).

import React from 'react';
import { motion } from 'motion/react';
import { Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp, Loader2 } from 'lucide-react';
import { usePlayer } from '../../store/player';
import { useLibrary } from '../../store/library';
import { useT } from '../../i18n';
import { Cover } from '../ui';
import { ProgressBar } from './ProgressBar';

export function PlayerBar() {
  const p = usePlayer();
  const { t } = useT();
  const favorites = useLibrary((s) => s.favorites);
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);

  if (!p.current && !p.queue.length) return null;
  const cur = p.current;
  if (!cur) return null;
  const isFav = favorites.includes(cur.id);

  return (
    <>
      {/* Desktop bar */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-[74px] z-40 surface-panel border-t items-center gap-4 px-4">
        {/* now playing */}
        <div className="flex items-center gap-3 w-[280px] shrink-0 min-w-0">
          <motion.div whileHover={{ scale: 1.04 }} className="cursor-pointer" onClick={() => p.setExpanded(true)} title={t('now_playing')}>
            <Cover track={cur} size={50} className="rounded-md" />
          </motion.div>
          <div className="min-w-0">
            <button onClick={() => p.setExpanded(true)} className="block text-sm font-semibold truncate hover:text-lime transition-colors text-left max-w-[180px]">{cur.title}</button>
            <div className="text-xs text-mute truncate max-w-[180px]">{cur.artist}</div>
          </div>
          <button
            aria-label={isFav ? t('unfavorite') : t('favorite')} aria-pressed={isFav}
            onClick={() => toggleFavorite(cur.id)}
            className={`p-1.5 rounded-full transition-colors ${isFav ? 'text-lime' : 'text-mute hover:text-ink'}`}
          >
            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* center controls */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-3">
            <button aria-label={t('shuffle')} aria-pressed={p.shuffle} onClick={p.toggleShuffle}
              className={`p-1.5 rounded-full transition-colors ${p.shuffle ? 'text-lime' : 'text-mute hover:text-ink'}`}>
              <Shuffle size={15} />
            </button>
            <button aria-label={t('previous')} onClick={p.prev} className="p-1.5 text-mute hover:text-ink transition-colors"><SkipBack size={19} /></button>
            <button
              aria-label={p.isPlaying ? t('pause') : t('play')}
              onClick={p.toggle}
              className="w-9 h-9 grid place-items-center rounded-full bg-ink text-black hover:scale-105 active:scale-95 transition-transform"
            >
              {p.loading ? <Loader2 size={16} className="animate-spin" /> : p.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button aria-label={t('next')} onClick={p.next} className="p-1.5 text-mute hover:text-ink transition-colors"><SkipForward size={19} /></button>
            <button aria-label={t('repeat')} onClick={p.cycleRepeat} aria-pressed={p.repeat !== 'off'}
              className={`p-1.5 rounded-full transition-colors ${p.repeat !== 'off' ? 'text-lime' : 'text-mute hover:text-ink'}`}>
              {p.repeat === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
            </button>
          </div>
          <div className="w-full max-w-[460px]">
            <ProgressBar position={p.positionSec} duration={p.durationSec || cur.durationSec} onSeek={p.seek} />
          </div>
        </div>

        {/* right side */}
        <div className="flex items-center gap-2 w-[240px] justify-end shrink-0">
          <button aria-label={t('queue')} aria-pressed={p.queueOpen} onClick={() => p.setQueueOpen(!p.queueOpen)}
            className={`p-1.5 rounded-full transition-colors relative ${p.queueOpen ? 'text-lime' : 'text-mute hover:text-ink'}`}>
            <ListMusic size={16} />
            {p.queue.length > 0 && <span className="absolute -top-1 -right-1 text-[9px] bg-raised border border-edge rounded-full px-1 tabular-nums">{p.queue.length}</span>}
          </button>
          <VolumeControl />
          <button aria-label={t('now_playing')} onClick={() => p.setExpanded(true)}
            className="p-1.5 text-mute hover:text-ink rounded-full transition-colors"><ChevronUp size={18} /></button>
        </div>
      </div>

      {/* Mobile mini-player */}
      <div className="md:hidden fixed bottom-[64px] left-2 right-2 z-40 surface-raised border rounded-xl shadow-pop px-3 py-2 flex items-center gap-3">
        <Cover track={cur} size={38} onClick={() => p.setExpanded(true)} />
        <button className="min-w-0 flex-1 text-left" onClick={() => p.setExpanded(true)}>
          <div className="text-sm font-semibold truncate">{cur.title}</div>
          <div className="text-[11px] text-mute truncate">{cur.artist}</div>
        </button>
        <button aria-label={p.isPlaying ? t('pause') : t('play')} onClick={p.prev} className="p-1 text-mute"><SkipBack size={17} /></button>
        <button aria-label={p.isPlaying ? t('pause') : t('play')} onClick={p.toggle} className="w-9 h-9 grid place-items-center rounded-full bg-lime text-black">
          {p.loading ? <Loader2 size={15} className="animate-spin" /> : p.isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>
        <button aria-label={t('next')} onClick={p.next} className="p-1 text-mute"><SkipForward size={17} /></button>
      </div>

      {/* Error strip */}
      {p.error && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="fixed md:bottom-[82px] bottom-[124px] left-1/2 -translate-x-1/2 z-50 bg-[#2a1216] border border-red-500/40 text-red-200 text-xs px-4 py-2 rounded-lg shadow-pop max-w-[90vw]">
          {p.error.startsWith('error_load') ? t('error_load') : p.error}
        </motion.div>
      )}
    </>
  );
}

function VolumeControl() {
  const p = usePlayer();
  const pct = (p.muted ? 0 : p.volume) * 100;
  return (
    <div className="flex items-center gap-2 w-[130px]">
      <button aria-label={p.muted ? 'Unmute' : 'Mute'} onClick={p.toggleMute} className="text-mute hover:text-ink p-1">
        {p.muted || p.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <input
        type="range" min={0} max={1} step={0.02} value={p.muted ? 0 : p.volume}
        aria-label="Volume" style={{ ['--pct' as never]: `${pct}%` }}
        className="w-full" onChange={(e) => p.setVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}
