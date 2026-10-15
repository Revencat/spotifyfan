import React from 'react';
import { fmtTime } from '../../utils/format';

export function ProgressBar({ position, duration, onSeek, thin }: {
  position: number; duration: number; onSeek: (sec: number) => void; thin?: boolean;
}) {
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  return (
    <div className={`flex items-center gap-2 ${thin ? 'text-[10px]' : 'text-xs'} text-mute tabular-nums w-full`}>
      {!thin && <span className="w-9 text-right shrink-0">{fmtTime(position)}</span>}
      <input
        type="range" min={0} max={Math.max(duration, 1)} step={0.5} value={Math.min(position, duration || 0)}
        aria-label="Seek" style={{ ['--pct' as never]: `${pct}%` }}
        className={`flex-1 ${thin ? 'h-1' : ''}`}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        disabled={!duration}
      />
      {!thin && <span className="w-9 shrink-0">{fmtTime(duration)}</span>}
    </div>
  );
}
