// SONORA shared UI primitives

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { Track } from '../types/music';
import { generateCover } from '../services/artwork';
import { useT } from '../i18n';
import { fmtTime } from '../utils/format';
import { useUi } from '../store/ui';

export function Logo({ small }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={small ? 22 : 26} height={small ? 22 : 26} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="14" fill="#0B0D10" stroke="#292E37" />
        <g stroke="#B7F36B" strokeWidth="5" strokeLinecap="round">
          <line x1="18" y1="24" x2="18" y2="40"><animate attributeName="y1" values="24;18;24" dur="2.4s" repeatCount="indefinite" /></line>
          <line x1="28" y1="16" x2="28" y2="48"><animate attributeName="y2" values="48;42;48" dur="1.8s" repeatCount="indefinite" /></line>
          <line x1="38" y1="22" x2="38" y2="42"><animate attributeName="y1" values="22;28;22" dur="2.1s" repeatCount="indefinite" /></line>
          <line x1="48" y1="27" x2="48" y2="37"><animate attributeName="y2" values="37;44;37" dur="1.6s" repeatCount="indefinite" /></line>
        </g>
      </svg>
      {!small && (
        <span className="font-extrabold tracking-[0.18em] text-lg">
          SONO<span className="text-lime">R</span>A
        </span>
      )}
    </span>
  );
}

export function EarlyBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-lime/15 text-lime text-[10px] font-bold tracking-widest px-2 py-0.5 border border-lime/25 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" aria-hidden /> EARLY ACCESS
    </span>
  );
}

export function Cover({ track, size = 48, className = '', onClick }: { track?: Track | null; size?: number; className?: string; onClick?: () => void }) {
  const seed = track ? `${track.title}|${track.artist}` : 'sonora-empty';
  const src = track?.coverUrl || generateCover(seed);
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onClick={onClick}
      className={`rounded-lg object-cover shrink-0 bg-raised ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => { (e.target as HTMLImageElement).src = generateCover(seed + '-f'); }}
    />
  );
}

export function PlayButton({ playing, onClick, size = 44, label }: { playing: boolean; onClick: (e: React.MouseEvent) => void; size?: number; label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className="grid place-items-center rounded-full bg-lime text-black hover:scale-105 hover:bg-lime-deep active:scale-95 transition-all shadow-card"
      style={{ width: size, height: size }}
    >
      {playing ? (
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>
      ) : (
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5c0-1.1 1.2-1.8 2.1-1.2l11 7.5c1 .7 1 2.2 0 2.9l-11 7.5c-.9.6-2.1-.1-2.1-1.2V4.5z" transform="scale(0.85) translate(2,2)"/></svg>
      )}
    </button>
  );
}

export function EqBars() {
  return (
    <span className="flex items-end gap-[2px] h-3 w-4" aria-label="playing" role="img">
      {[0, 1, 2].map((i) => (
        <span key={i} className="eq-bar w-[3px] rounded-sm bg-lime" style={{ height: '100%', animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={ref}
            role="dialog" aria-modal="true"
            className={`surface-raised border rounded-2xl shadow-pop w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] overflow-auto`}
            initial={{ scale: 0.94, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="sr-only">Dialog</span>
              <button onClick={onClose} aria-label="Close" className="ml-auto text-mute hover:text-ink p-1"><X size={18} /></button>
            </div>
            <div className="p-5 pt-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg bg-panel border border-edge px-3 py-2 text-sm placeholder:text-mute/60 focus:border-lime/60 outline-none transition-colors';

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-lime' : 'bg-edge'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl surface-panel border border-dashed"
    >
      <div className="text-lime/70 mb-4">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {sub && <p className="text-mute text-sm mt-1.5 max-w-sm">{sub}</p>}
      {action && <div className="mt-5 flex gap-3 flex-wrap justify-center">{action}</div>}
    </motion.div>
  );
}

export function Btn({ children, onClick, primary, small, className = '', disabled, title, type }: {
  children: React.ReactNode; onClick?: () => void; primary?: boolean; small?: boolean; className?: string; disabled?: boolean; title?: string; type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick} disabled={disabled} title={title}
      className={`inline-flex items-center gap-2 rounded-full font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none
        ${primary ? 'bg-lime text-black hover:bg-lime-deep shadow-card' : 'surface-raised border text-ink hover:border-lime/50'}
        ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} ${className}`}
    >
      {children}
    </button>
  );
}

export function SourceBadge({ track }: { track: Track }) {
  const { t } = useT();
  if (track.source === 'jamendo')
    return <span title="Jamendo — independent online catalog" className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-electric/15 text-electric border border-electric/30">{t('online_badge')} · JAMENDO</span>;
  if (track.sourceId.startsWith('demo:'))
    return <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30">{t('demo_badge')}</span>;
  return null;
}

export function TrackRow({ track, index, onPlay, contextMenu, active }: {
  track: Track; index: number; onPlay: () => void; active?: boolean;
  contextMenu?: (e: React.MouseEvent) => void;
}) {
  const { t } = useT();
  const fav = false;
  return (
    <div
      onDoubleClick={onPlay}
      onContextMenu={contextMenu}
      className={`group grid grid-cols-[28px_minmax(0,4fr)_minmax(0,3fr)_70px_40px] md:grid-cols-[28px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_70px_40px] items-center gap-3 px-3 py-2 rounded-lg hover:bg-raised transition-colors cursor-default ${active ? 'bg-raised' : ''}`}
    >
      <div className="text-mute text-sm tabular-nums w-7 text-center">
        {active ? <EqBars /> : <span className="group-hover:hidden">{index + 1}</span>}
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <Cover track={track} size={38} onClick={onPlay} />
        <div className="min-w-0">
          <div className={`text-sm font-medium truncate ${active ? 'text-lime' : ''}`}>{track.title}</div>
          <div className="text-xs text-mute truncate flex items-center gap-1.5">{track.artist}<SourceBadge track={track} /></div>
        </div>
      </div>
      <div className="text-sm text-mute truncate hidden md:block">{track.album}</div>
      <div className="text-sm text-mute truncate">{track.genre ?? ''}</div>
      <div className="text-sm text-mute tabular-nums text-right">{fmtTime(track.durationSec)}</div>
      <button onClick={contextMenu} aria-label={t('info')} className="opacity-0 group-hover:opacity-100 text-mute hover:text-ink p-1 rounded" >⋯</button>
    </div>
  );
}

export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            onClick={() => dismiss(toast.id)}
            className={`pointer-events-auto cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium shadow-pop border
              ${toast.kind === 'error' ? 'bg-[#2a1216] border-red-500/40 text-red-200' : 'surface-raised text-ink'}`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
