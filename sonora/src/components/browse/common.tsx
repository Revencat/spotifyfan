// SONORA — shared browse components.

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import type { Track } from '../../types/music';
import { usePlayer } from '../../store/player';
import { useLibrary } from '../../store/library';
import { Cover, PlayButton, EqBars, SourceBadge } from '../ui';
import { useT } from '../../i18n';
import { useTrackMenuOpener } from '../trackMenu';
import { Link } from '../../router';
import { fmtTime } from '../../utils/format';

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

/** Card with big cover + play FAB that actually plays a real context. */
export function MediaCard({ track, label, sub, to, contextTracks, onPlayOverride }: {
  track?: Track | null; label: string; sub?: string; to?: string;
  contextTracks: Track[]; onPlayOverride?: () => void;
}) {
  const player = usePlayer();
  const isCurrent = player.current?.id === track?.id;
  const openMenu = useTrackMenuOpener();
  const body = (
    <>
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-card">
        <Cover track={track} size={200} className="w-full h-full rounded-none" />
        <motion.div
          initial={{ opacity: 0, y: 10 }} whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 right-2 opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 transition-opacity"
        >
          <PlayButton
            playing={isCurrent && player.isPlaying}
            label={isCurrent && player.isPlaying ? 'Pause' : 'Play'}
            onClick={() => onPlayOverride ? onPlayOverride() : player.playContext(contextTracks)}
          />
        </motion.div>
        {isCurrent && player.isPlaying && (
          <span className="absolute top-2 left-2 surface-raised border rounded-full px-2 py-1"><EqBars /></span>
        )}
      </div>
      <div className="font-semibold text-sm truncate flex items-center gap-2">{label}{isCurrent && player.isPlaying && <EqBars />}</div>
      {sub && <div className="text-xs text-mute truncate mt-0.5">{sub}</div>}
    </>
  );
  return to ? (
    <Link to={to} className="group/card block p-3 -m-1 rounded-xl hover:bg-raised/60 transition-colors card-hover" onContextMenu={(e) => track && openMenu(e, track)}>
      {body}
    </Link>
  ) : (
    <div className="group/card p-3 -m-1 rounded-xl hover:bg-raised/60 transition-colors card-hover cursor-pointer" onClick={() => onPlayOverride ? onPlayOverride() : player.playContext(contextTracks)} onContextMenu={(e) => track && openMenu(e, track)}>
      {body}
    </div>
  );
}

export function Shelf({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
      {children}
    </div>
  );
}

/** Fade-in wrapper for page sections */
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className="mb-8"
    >
      {children}
    </motion.section>
  );
}

/** Editable track list used by playlist & album pages */
export function TrackList({ tracks, contextBase, editable, onRemove, onReorder }: {
  tracks: Track[]; contextBase: Track[]; editable?: boolean;
  onRemove?: (index: number) => void; onReorder?: (from: number, to: number) => void;
}) {
  const player = usePlayer();
  const { t } = useT();
  const openMenu = useTrackMenuOpener();
  const dragFrom = useRef<number | null>(null);

  return (
    <div className="space-y-0.5">
      {tracks.map((tr, i) => {
        const active = player.current?.id === tr.id;
        return (
          <div
            key={`${tr.id}-${i}`}
            draggable={editable}
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragFrom.current != null && dragFrom.current !== i) onReorder?.(dragFrom.current, i); dragFrom.current = null; }}
            onDoubleClick={() => player.playContext(contextBase, i)}
            onContextMenu={(e) => openMenu(e, tr)}
            className={`group grid grid-cols-[24px_minmax(0,5fr)_minmax(0,3fr)_56px_64px] items-center gap-3 px-3 py-2 rounded-lg hover:bg-raised transition-colors ${active ? 'bg-raised' : ''}`}
          >
            <div className="text-mute text-sm tabular-nums text-center">
              {active && player.isPlaying ? <EqBars /> : <span className="group-hover:hidden">{i + 1}</span>}
              {!active && <button hidden aria-label={t('play')} />}
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <Cover track={tr} size={36} onClick={() => player.playContext(contextBase, i)} />
              <div className="min-w-0">
                <div className={`text-sm font-medium truncate ${active ? 'text-lime' : ''}`}>{tr.title}</div>
                <div className="text-xs text-mute truncate flex items-center gap-1.5">{tr.artist}<SourceBadge track={tr} /></div>
              </div>
            </div>
            <div className="text-sm text-mute truncate hidden sm:block">{tr.album}</div>
            <div className="text-sm text-mute tabular-nums text-right">{fmtTime(tr.durationSec)}</div>
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editable && onRemove && (
                <button aria-label={t('remove')} onClick={() => onRemove(i)} className="text-mute hover:text-red-400 p-1 text-xs">✕</button>
              )}
              <button aria-label={t('add_to_queue')} onClick={() => player.addToQueue(tr)} className="text-mute hover:text-lime p-1 text-xs font-bold">+Q</button>
              <button aria-label={t('info')} onClick={(e) => openMenu(e as unknown as React.MouseEvent, tr)} className="text-mute hover:text-ink p-1">⋯</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Simple library filter chips row */
export function Chips<T extends string>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${value === o.v ? 'bg-lime text-black border-lime' : 'surface-raised text-mute hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function usePlayHelpers() {
  const lib = useLibrary();
  const player = usePlayer();
  const playIds = (ids: string[], shuffle = false) => {
    const tracks = ids.map((id) => lib.tracks[id]).filter(Boolean);
    if (tracks.length) player.playContext(tracks, shuffle ? Math.floor(Math.random() * tracks.length) : 0, shuffle);
  };
  return { playIds };
}
