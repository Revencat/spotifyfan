// SONORA — procedural cover art.
// No copyrighted images: covers for local tracks without embedded art are generated
// deterministically from the track's own metadata (hash of title+artist).

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PALETTES = [
  ['#B7F36B', '#1c3a12', '#0d1f08'],
  ['#5B8CFF', '#12203f', '#090f1f'],
  ['#A78BFA', '#241a3f', '#120d21'],
  ['#F3A66B', '#3f2412', '#1f1108'],
  ['#6BF3E0', '#123f3a', '#081f1d'],
  ['#F36B8E', '#3f1224', '#1f0812'],
];

/** Returns a data-URL SVG cover derived from track text. Stable across sessions. */
export function generateCover(seed: string, label?: string): string {
  const h = hashString(seed);
  const pal = PALETTES[h % PALETTES.length];
  const style = (h >> 8) % 4;
  const rot = (h >> 4) % 360;
  const cx = 30 + (h % 40);
  const cy = 30 + ((h >> 12) % 40);
  let shapes = '';
  if (style === 0) {
    // concentric rings
    for (let i = 0; i < 5; i++) {
      shapes += `<circle cx="${cx}" cy="${cy}" r="${12 + i * 11}" fill="none" stroke="${pal[0]}" stroke-opacity="${0.8 - i * 0.14}" stroke-width="${2 + (i % 2)}"/>`;
    }
  } else if (style === 1) {
    // waveform bars
    for (let i = 0; i < 9; i++) {
      const hh = 8 + ((h >> (i * 2)) % 34);
      shapes += `<rect x="${10 + i * 9}" y="${50 - hh / 2}" width="4.5" height="${hh}" rx="2.25" fill="${pal[0]}" opacity="${0.5 + ((h >> i) % 5) / 10}"/>`;
    }
  } else if (style === 2) {
    // diagonal stripes
    shapes += `<g transform="rotate(${rot} 50 50)">`;
    for (let i = 0; i < 6; i++) {
      shapes += `<rect x="-20" y="${i * 18 - 10}" width="140" height="${5 + (h >> i) % 8}" fill="${pal[0]}" opacity="${0.25 + (i % 3) * 0.2}"/>`;
    }
    shapes += '</g>';
  } else {
    // blob gradient + dot grid
    shapes += `<circle cx="${cx}" cy="${cy}" r="34" fill="${pal[0]}" opacity="0.85"/>`;
    for (let gx = 0; gx < 8; gx++)
      for (let gy = 0; gy < 8; gy++) {
        if ((h >> ((gx + gy) % 24)) % 3 === 0)
          shapes += `<circle cx="${8 + gx * 12}" cy="${8 + gy * 12}" r="1.4" fill="${pal[0]}" opacity="0.5"/>`;
      }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[1]}"/><stop offset="1" stop-color="${pal[2]}"/></linearGradient></defs><rect width="100" height="100" fill="url(#bg)"/>${shapes}${label ? `<text x="6" y="94" font-family="Inter,sans-serif" font-size="7" font-weight="700" fill="#fff" fill-opacity="0.85">${label.slice(0, 14)}</text>` : ''}</svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/** Dominant-ish color extraction for ambient backgrounds (samples an image into canvas). */
export function extractColor(imgSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 8; c.height = 8;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 8, 8);
        const d = ctx.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        }
        if (!n) return resolve('#B7F36B');
        resolve(`rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`);
      } catch {
        resolve('#B7F36B');
      }
    };
    img.onerror = () => resolve('#B7F36B');
    img.src = imgSrc;
  });
}
