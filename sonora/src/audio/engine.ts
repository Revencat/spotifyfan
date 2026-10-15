// SONORA audio engine — single HTMLAudioElement shared by the whole app.
// Kept separate from React so playback survives every navigation.

class AudioEngine {
  private el: HTMLAudioElement | null = null;
  private timeCbs: ((t: number, d: number) => void)[] = [];
  private endCbs: (() => void)[] = [];
  private errCbs: ((msg: string) => void)[] = [];
  private objectUrl: string | null = null;

  private ensure(): HTMLAudioElement {
    if (this.el) return this.el;
    const el = new window.Audio();
    el.preload = 'auto';
    el.addEventListener('timeupdate', () => {
      for (const cb of this.timeCbs) cb(el.currentTime, el.duration || 0);
    });
    el.addEventListener('ended', () => { for (const cb of this.endCbs) cb(); });
    el.addEventListener('error', () => {
      const code = el.error?.code;
      const msg =
        code === 4 ? 'The audio format is not supported by this browser, or the stream failed.'
        : code === 2 ? 'Network error while loading audio.'
        : 'error_load';
      for (const cb of this.errCbs) cb(msg);
    });
    this.el = el;
    return el;
  }

  load(url: string, autoplay: boolean) {
    const el = this.ensure();
    el.src = url;
    el.load();
    if (autoplay) this.play();
  }

  play() {
    const el = this.ensure();
    el.play().catch((e: unknown) => {
      const name = (e as { name?: string })?.name;
      if (name === 'NotAllowedError') {
        for (const cb of this.errCbs) cb('Press play again — browsers block automatic playback.');
      } else {
        for (const cb of this.errCbs) cb('error_load');
      }
    });
  }

  pause() { this.el?.pause(); }
  seek(sec: number) { if (this.el && isFinite(sec)) this.el.currentTime = sec; }
  setVolume(v: number) { if (this.el) { this.el.volume = Math.max(0, Math.min(1, v)); } else { this.pendingVol = v; } }
  private pendingVol = 0.8;

  onTime(cb: (t: number, d: number) => void) { this.timeCbs.push(cb); }
  onEnd(cb: () => void) { this.endCbs.push(cb); }
  onError(cb: (msg: string) => void) { this.errCbs.push(cb); }

  get element() { return this.el; }
}

export const engine = new AudioEngine();
