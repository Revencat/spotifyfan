// Best-effort audio metadata extraction without external libraries.
// Strategy:
//  1. Decode duration with Web Audio API (reliable for formats the browser supports).
//  2. Parse ID3v2 tags (TIT2/TPE1/TALB/TCON/TYER + APIC cover) from MP3 headers.

import type { Track } from '../types/music';

export interface ParsedMeta {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  coverUrl?: string;
  durationSec: number;
}

function readStr(buf: ArrayBuffer, offset: number, len: number, encoding: number): string {
  const bytes = new Uint8Array(buf, offset, len);
  let start = 0;
  // skip BOM
  if (encoding === 1 && bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) start = 2;
  if (encoding === 2 && bytes.length >= 2) start = 0;
  try {
    if (encoding === 0 || encoding === 3) {
      const td = new TextDecoder(encoding === 3 ? 'utf-8' : 'iso-8859-1');
      return td.decode(bytes.slice(start)).replace(/\0+$/g, '').trim();
    }
    const td = new TextDecoder('utf-16le');
    return td.decode(bytes.slice(start)).replace(/\0+$/g, '').trim();
  } catch {
    return '';
  }
}

export function parseId3v2(fileBytes: ArrayBuffer): Partial<ParsedMeta> {
  const out: Partial<ParsedMeta> = {};
  const view = new DataView(fileBytes);
  const dv = new Uint8Array(fileBytes);
  // "ID3"
  if (dv[0] !== 0x49 || dv[1] !== 0x44 || dv[2] !== 0x33) return out;
  const version = dv[3];
  if (version < 3) return out; // only v2.3/v2.4 supported here
  const tagSize =
    ((dv[6] & 0x7f) << 21) | ((dv[7] & 0x7f) << 14) | ((dv[8] & 0x7f) << 7) | (dv[9] & 0x7f);
  let pos = 10;
  const end = Math.min(10 + tagSize, fileBytes.byteLength);
  while (pos + 10 <= end) {
    const id = String.fromCharCode(dv[pos], dv[pos + 1], dv[pos + 2], dv[pos + 3]);
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    let size: number;
    if (version === 4) {
      size =
        ((dv[pos + 4] & 0x7f) << 21) | ((dv[pos + 5] & 0x7f) << 14) |
        ((dv[pos + 6] & 0x7f) << 7) | (dv[pos + 7] & 0x7f);
    } else {
      size = view.getUint32(pos + 4);
    }
    if (size <= 0 || pos + 10 + size > end) break;
    const dataStart = pos + 10;
    if (id === 'TIT2' || id === 'TPE1' || id === 'TALB' || id === 'TCON' || id === 'TYER' || id === 'TDRC') {
      const enc = dv[dataStart];
      const text = readStr(fileBytes, dataStart + 1, size - 1, enc);
      if (id === 'TIT2') out.title = text;
      if (id === 'TPE1') out.artist = text;
      if (id === 'TALB') out.album = text;
      if (id === 'TCON') out.genre = text.replace(/^\(\d+\)/, '');
      if (id === 'TYER' || id === 'TDRC') {
        const y = parseInt(text.slice(0, 4), 10);
        if (!isNaN(y)) out.year = y;
      }
    } else if (id === 'APIC') {
      // MIME (null-term) + flags + desc (null-term) + picture bytes
      const enc = dv[dataStart];
      let p = dataStart + 1;
      let mime = '';
      while (p < end && dv[p] !== 0) { mime += String.fromCharCode(dv[p]); p++; }
      p++; // null
      p++; // picture type byte
      // description
      if (enc === 1 || enc === 2) {
        while (p + 1 < end && !(dv[p] === 0 && dv[p + 1] === 0)) p += 2;
        p += 2;
      } else {
        while (p < end && dv[p] !== 0) p++;
        p++;
      }
      const imgLen = dataStart + size - p;
      if (imgLen > 0) {
        const bytes = new Uint8Array(fileBytes, p, imgLen);
        if (mime !== 'image/png' && mime !== 'image/jpeg' && mime !== 'image/webp') {
          mime = bytes[0] === 0x89 ? 'image/png' : 'image/jpeg';
        }
        // Convert to data URL so it can be persisted as track cover art.
        const bin: string[] = [];
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          bin.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK))));
        }
        out.coverUrl = `data:${mime};base64,${btoa(bin.join(''))}`;
      }
    }
    pos = dataStart + size;
  }
  return out;
}

async function decodeDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = new window.Audio();
    a.preload = 'metadata';
    const done = (d: number) => { URL.revokeObjectURL(url); resolve(d); };
    a.onloadedmetadata = () => done(isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => {
      // Fallback: Web Audio decode
      blob.arrayBuffer()
        .then((buf) => {
          const ctx = new OfflineAudioContext(1, 1, 44100);
          return ctx.decodeAudioData(buf);
        })
        .then((d) => done(d.duration))
        .catch(() => done(0));
    };
    a.src = url;
  });
}

export async function analyzeAudioFile(file: File): Promise<{ meta: ParsedMeta; buffer: ArrayBuffer }> {
  const buffer = await file.arrayBuffer();
  const head = buffer.slice(0, Math.min(buffer.byteLength, 512 * 1024)); // first 512KB enough for tags
  const id3 = parseId3v2(head);
  const durationSec = await decodeDuration(file);
  const fallbackTitle = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
  return {
    buffer,
    meta: {
      title: id3.title || fallbackTitle,
      artist: id3.artist || 'Unknown artist',
      album: id3.album || 'Singles',
      genre: id3.genre,
      year: id3.year,
      coverUrl: id3.coverUrl,
      durationSec,
    },
  };
}

export function makeLocalTrack(meta: ParsedMeta, fileName: string, size: number): Track {
  const id = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    source: 'local',
    sourceId: `${fileName}:${size}`,
    title: meta.title || fileName,
    artist: meta.artist || 'Unknown artist',
    album: meta.album || 'Singles',
    durationSec: Math.round(meta.durationSec),
    coverUrl: meta.coverUrl,
    genre: meta.genre,
    year: meta.year,
    addedAt: Date.now(),
  };
}
