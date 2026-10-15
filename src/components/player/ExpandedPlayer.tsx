// SONORA — expanded immersive player with queue panel and ambient cover colors.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, GripVertical, Heart, ListMusic, Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { usePlayer } from '../../store/player';
import { useLibrary } from '../../store/library';
import { useT } from '../../i18n';
import { Cover, SourceBadge } from '../ui';
import { ProgressBar } from './ProgressBar';
import { Visualizer } from './Visualizer';
import { extractColor } from '../../services/artwork';
import { fmtTime } from '../../utils/format';

export function ExpandedPlayer() {
  const p = usePlayer();
  const { t } = useT();
  const favorites = useLibrary((s) => s.favorites);
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);
  const [accent, setAccent] = useState('#B7F36B');
  const dragFrom = useRef<number | null>(null);

  const cur = p.current;
  useEffect(() => {
    if (cur?.coverUrl && !cur.coverUrl.startsWith('data:image/svg')) {
      let alive = true;
      extractColor(cur.coverUrl).then((c) => alive && setAccent(c));
      return () => { alive = false; };
    }
    setAccent('#B7F36B');
  }, [cur?.id, cur?.coverUrl]);

  const isFav = cur ? favorites.includes(cur.id) : false;

  return (
    <AnimatePresence>
      {p.expanded && cur && (
        <motion.div
          className="fixed inset-0 z-[55] overflow-y-auto"
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          {/* ambient background derived from cover */}
          <div className="absolute inset-0 bg-base" />
          <div className="absolute inset-0 opacity-40 transition-colors duration-1000"
            style={{ background: `radial-gradient(90% 70% at 50% -10%, ${accent}, transparent 70%), radial-gradient(60% 50% at 80% 110%, ${accent}55, transparent 60%)` }} />
          <div className="absolute inset-0 backdrop-blur-[80px]" />

          <div className="relative min-h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => p.setExpanded(false)} aria-label={t('close')} className="p-2 text-mute hover:text-ink rounded-full hover:bg-white/5">
                <ChevronDown size={22} />
              </button>
              <span className="text-xs font-semibold tracking-widest uppercase text-mute">{t('now_playing')}</span>
              <button onClick={() => p.setQueueOpen(!p.queueOpen)} aria-label={t('queue')}
                className={`p-2 rounded-full hover:bg-white/5 ${p.queueOpen ? 'text-lime' : 'text-mute hover:text-ink'}`}>
                <ListMusic size={20} />
              </button>
            </div>

            <div className="flex-1 grid lg:grid-cols-[1fr_380px] gap-8 px-6 pb-40 pt-4 max-w-6xl mx-auto w-full">
              {/* left: art + controls */}
              <div className="flex flex-col items-center justify-center gap-6">
                <motion.div
                  key={cur.id}
                  initial={{ scale: 0.92, opacity: 0, rotate: -1 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                  className="w-[min(70vw,380px)] aspect-square shadow-pop"
                >
                  <Cover track={cur} size={380} className="w-full h-full rounded-2xl" />
                </motion.div>

                <div className="w-full max-w-[440px] text-center">
                  <h2 className="text-2xl font-extrabold truncate">{cur.title}</h2>
                  <p className="text-mute mt-1 flex items-center justify-center gap-2">{cur.artist}<SourceBadge track={cur} /></p>
                  {cur.album && <p className="text-xs text-mute/70 mt-0.5">{cur.album}{cur.year ? ` · ${cur.year}` : ''}</p>}
                </div>

                <div className="w-full max-w-[440px]">
                  <ProgressBar position={p.positionSec} duration={p.durationSec || cur.durationSec} onSeek={p.seek} />
                </div>

                <div className="flex items-center gap-5">
                  <button aria-label={t('shuffle')} aria-pressed={p.shuffle} onClick={p.toggleShuffle}
                    className={`p-2 rounded-full ${p.shuffle ? 'text-lime' : 'text-mute hover:text-ink'}`}><Shuffle size={17} /></button>
                  <button aria-label={t('previous')} onClick={p.prev} className="p-2 text-ink hover:scale-110 transition-transform"><SkipBack size={26} /></button>
                  <button aria-label={p.isPlaying ? t('pause') : t('play')} onClick={p.toggle}
                    className="w-14 h-14 grid place-items-center rounded-full bg-lime text-black hover:scale-105 active:scale-95 transition-transform shadow-card">
                    {p.loading ? <Loader2 size={22} className="animate-spin" /> : p.isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                  </button>
                  <button aria-label={t('next')} onClick={p.next} className="p-2 text-ink hover:scale-110 transition-transform"><SkipForward size={26} /></button>
                  <button aria-label={t('repeat')} onClick={p.cycleRepeat} aria-pressed={p.repeat !== 'off'}
                    className={`p-2 rounded-full ${p.repeat !== 'off' ? 'text-lime' : 'text-mute hover:text-ink'}`}>
                    {p.repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full max-w-[300px] justify-center">
                  <button aria-label={isFav ? t('unfavorite') : t('favorite')} onClick={() => toggleFavorite(cur.id)}
                    className={`p-2 rounded-full ${isFav ? 'text-lime' : 'text-mute hover:text-ink'}`}>
                    <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                  <VolumeMini />
                </div>

                {p.isPlaying && <div className="w-full max-w-[320px] mt-2"><Visualizer color={accent} height={40} /></div>}
              </div>

              {/* right: queue */}
              <AnimatePresence>
                {p.queueOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                    className="surface-raised border rounded-2xl p-4 self-start max-h-[70vh] overflow-hidden flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">{t('queue')}</h3>
                      <span className="text-xs text-mute">{p.queue.length} {t('total_tracks')} · {t('drag_hint')}</span>
                    </div>
                    <div className="overflow-y-auto flex-1 -mx-1 px-1">
                      {p.queue.length === 0 && <p className="text-sm text-mute py-6 text-center">{t('queue_empty')}</p>}
                      {p.queue.map((track, i) => (
                        <div
                          key={`${track.id}-${i}`}
                          draggable
                          onDragStart={() => (dragFrom.current = i)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragFrom.current != null && dragFrom.current !== i) p.moveInQueue(dragFrom.current, i);
                            dragFrom.current = null;
                          }}
                          onClick={() => p.selectQueueItem(i)}
                          className={`group flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${i === p.index ? 'bg-white/5' : 'hover:bg-white/5'}`}
                        >
                          <GripVertical size={14} className="text-mute/40 group-hover:text-mute cursor-grab shrink-0" />
                          <Cover track={track} size={34} />
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm truncate font-medium ${i === p.index ? 'text-lime' : ''}`}>{track.title}</div>
                            <div className="text-xs text-mute truncate">{track.artist}</div>
                          </div>
                          <span className="text-xs text-mute tabular-nums hidden sm:block">{fmtTime(track.durationSec)}</span>
                          <button aria-label={t('remove')} onClick={(e) => { e.stopPropagation(); p.removeFromQueue(i); }}
                            className="opacity-0 group-hover:opacity-100 text-mute hover:text-red-400 p-1"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VolumeMini() {
  const p = usePlayer();
  const pct = (p.muted ? 0 : p.volume) * 100;
  return (
    <div className="flex items-center gap-2 w-[150px]">
      <button aria-label="Mute" onClick={p.toggleMute} className="text-mute hover:text-ink">
        {p.muted || p.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <input type="range" min={0} max={1} step={0.02} value={p.muted ? 0 : p.volume}
        aria-label="Volume" style={{ ['--pct' as never]: `${pct}%` }} className="w-full"
        onChange={(e) => p.setVolume(parseFloat(e.target.value))} />
    </div>
  );
}
