// Tiny canvas visualizer driven by Web Audio AnalyserNode. Only active while playing,
// low cost (64 bins, rAF). Respects prefers-reduced-motion.

import { useEffect, useRef } from 'react';
import { engine } from '../../audio/engine';

let ctxRef: AudioContext | null = null;
let analyserRef: AnalyserNode | null = null;
let connectedSrc: MediaElementAudioSourceNode | null = null;

function ensureAnalyser(): AnalyserNode | null {
  try {
    const el = engine.element;
    if (!el) return null;
    if (!ctxRef) ctxRef = new AudioContext();
    if (!analyserRef) {
      if (!connectedSrc) {
        connectedSrc = ctxRef.createMediaElementSource(el);
        connectedSrc.connect(ctxRef.destination);
      }
      analyserRef = ctxRef.createAnalyser();
      analyserRef.fftSize = 128;
      connectedSrc.connect(analyserRef);
    }
    if (ctxRef.state === 'suspended') ctxRef.resume().catch(() => {});
    return analyserRef;
  } catch {
    return null; // cross-origin streams may taint analysis; degrade silently
  }
}

export function Visualizer({ height = 48, color = '#B7F36B' }: { height?: number; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let data: Uint8Array | null = null;

    const draw = () => {
      const a = analyserRef ?? ensureAnalyser();
      if (a) {
        if (!data || data.length !== a.frequencyBinCount) data = new Uint8Array(a.frequencyBinCount);
        a.getByteFrequencyData(data as Uint8Array);
      }
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 40;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const v = data ? (data[Math.floor((i / bars) * data.length)] / 255) : 0;
        const bh = Math.max(2, v * h);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 + v * 0.6;
        ctx.beginPath();
        ctx.roundRect(i * bw + 1, h - bh, bw - 2, bh, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [color]);

  return <canvas ref={ref} width={320} height={height} className="w-full opacity-80" aria-hidden />;
}

export { ensureAnalyser };
