// SONORA — Get SONORA (install/PWA), Early Access, Reven, Stats, Settings, Onboarding.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Monitor, Smartphone, Download, Check, X, Github, Mail, Link2, Sparkles,
  BarChart3, Trash2, FileJson, Upload, Info, WindowStack,
} from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePrefs } from '../store/prefs';
import { useRouter, Link } from '../router';
import { useT } from '../i18n';
import { Reveal, SectionTitle } from '../components/browse/common';
import { Btn, Modal, Field, inputCls, EmptyState, EarlyBadge, Logo, Toggle } from '../components/ui';
import { usePwaInstall, platformHint, isStandalone } from '../hooks/usePwaInstall';
import { idbEstimate, lsGet } from '../services/db';
import { fmtLongTime } from '../utils/format';

export const APP_VERSION = '0.1.0';

/* ─────────────────────────── GET SONORA ─────────────────────────── */

export function GetSonoraPage() {
  const { t } = useT();
  const { state, promptInstall, canAutoInstall } = usePwaInstall();
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1000px] mx-auto">
      <Reveal>
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4"><Logo /></div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t('get_sonora')}</h1>
          <p className="text-mute mt-3 text-lg">{t('get_sub')}</p>
          <div className="flex justify-center mt-4"><EarlyBadge /></div>
        </div>
      </Reveal>

      {/* App representation */}
      <Reveal delay={0.05}>
        <div className="surface-panel border rounded-2xl p-3 shadow-card mb-8 overflow-hidden">
          <div className="rounded-xl bg-base border border-edge overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-edge bg-panel">
              <span className="w-2.5 h-2.5 rounded-full bg-edge" /><span className="w-2.5 h-2.5 rounded-full bg-edge" />
              <Logo small /><span className="ml-auto text-[10px] text-mute">v{APP_VERSION}</span>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-4 p-4">
              <div className="space-y-2 hidden sm:block">
                {[t('nav_home'), t('nav_explore'), t('nav_library'), t('nav_favorites')].map((x, i) => (
                  <div key={x} className={`h-6 rounded-lg text-[11px] flex items-center px-3 ${i === 0 ? 'bg-lime/15 text-lime font-bold' : 'bg-raised text-mute'}`}>{x}</div>
                ))}
              </div>
              <div>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="aspect-square rounded-lg" style={{ background: `linear-gradient(135deg, hsl(${100 + i * 40} 60% 18%), hsl(${140 + i * 40} 70% 10%))` }} />
                  ))}
                </div>
                <div className="mt-3 surface-raised border rounded-lg px-3 py-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-lime/20" />
                  <div className="flex-1"><div className="h-2 w-1/2 rounded bg-raised" /><div className="h-2 w-1/3 rounded bg-raised mt-1.5" /></div>
                  <div className="flex gap-1 items-end h-4">
                    {[3, 6, 4, 7, 5].map((h, i) => <span key={i} className="w-1 rounded-sm bg-lime eq-bar" style={{ height: h * 2, animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Why install */}
      <Reveal delay={0.1}>
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: <WindowStack size={18} />, title: 'Standalone window', sub: 'SONORA opens like a native app, without browser chrome.' },
            { icon: <Download size={18} />, title: 'Instant updates', sub: 'Every deploy ships to your installed app automatically.' },
            { icon: <Sparkles size={18} />, title: 'Your library lives here', sub: 'Imported music and playlists stay on this device.' },
          ].map((f) => (
            <div key={f.title} className="surface-panel border rounded-xl p-4">
              <span className="text-lime">{f.icon}</span>
              <div className="font-bold text-sm mt-2">{f.title}</div>
              <div className="text-mute text-xs mt-1 leading-relaxed">{f.sub}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Install action */}
      <Reveal delay={0.15}>
        <div className="surface-panel border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-extrabold mb-1 flex items-center gap-2"><Smartphone size={20} className="text-lime" /> Web App (PWA)</h2>
          <p className="text-mute text-sm mb-4">{t('offline_ready')}</p>

          {isStandalone() ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-lime"><Check size={18} /> {t('installed')}</div>
          ) : canAutoInstall ? (
            <Btn primary onClick={promptInstall}><Download size={16} /> {state === 'installed' ? t('installed') : t('install')}</Btn>
          ) : (
            <>
              <Btn primary onClick={() => setHowOpen(true)}>
                <Download size={16} /> {t('install')}
              </Btn>
              <p className="text-mute text-xs mt-3 max-w-md leading-relaxed">
                Your browser didn’t offer an install prompt right now (this needs HTTPS and a visited session, or a browser that supports PWA installs). You can still install from the browser menu:
              </p>
            </>
          )}
        </div>
      </Reveal>

      {/* Desktop builds — honest status */}
      <Reveal delay={0.2}>
        <div className="surface-panel border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-extrabold mb-1 flex items-center gap-2"><Monitor size={20} className="text-accentblue" /> Desktop apps</h2>
          <p className="text-mute text-sm mb-4">{t('desktop_soon')}</p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {['Windows', 'macOS', 'Linux'].map((os) => (
              <div key={os} className="surface-raised border rounded-xl p-3 text-center opacity-70">
                <div className="font-bold text-sm">{os}</div>
                <div className="text-[11px] text-mute mt-1 flex items-center justify-center gap-1"><X size={12} /> .deb / .dmg / .msi — not published yet</div>
              </div>
            ))}
          </div>
          <p className="text-mute text-xs mt-4 leading-relaxed">
            Native builds will come from real Tauri releases of this project. Until then, the PWA above gives you an installed app experience on desktop browsers.
          </p>
        </div>
      </Reveal>

      {/* Version & changelog */}
      <Reveal delay={0.25}>
        <div className="surface-panel border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold">{t('whats_new')}</h2>
            <span className="text-xs text-mute">{t('version')} {APP_VERSION} · <EarlyBadge /></span>
          </div>
          <ul className="text-sm text-mute space-y-1.5 list-disc pl-5">
            <li>Local library with MP3/WAV/OGG import, ID3 metadata & embedded covers.</li>
            <li>Persistent player: queue, shuffle, repeat, volume, expanded view.</li>
            <li>Jamendo independent catalog integration with attribution.</li>
            <li>Playlists, favorites, listening stats, EN/ES languages.</li>
            <li>PWA installation from the browser.</li>
          </ul>
        </div>
      </Reveal>

      <Modal open={howOpen} onClose={() => setHowOpen(false)}>
        <h3 className="font-bold text-lg mb-2">{t('install')}</h3>
        <p className="text-sm text-mute mb-3 leading-relaxed">{platformHint()}</p>
        <p className="text-xs text-mute">{t('offline_ready')}</p>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── EARLY ACCESS ─────────────────────────── */

export function EarlyAccessPage() {
  const { t } = useT();
  const { navigate } = useRouter();
  return (
    <div className="px-4 md:px-8 py-8 max-w-[900px] mx-auto">
      <Reveal>
        <div className="flex items-center gap-3 mb-2"><h1 className="text-4xl font-extrabold tracking-tight">{t('nav_early')}</h1><EarlyBadge /></div>
        <p className="text-mute text-lg mb-8">{t('tagline')}</p>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="surface-panel border rounded-2xl p-6 mb-6">
          <h2 className="font-extrabold text-lg mb-2">What Early Access means</h2>
          <p className="text-sm text-mute leading-relaxed">
            SONORA is an independent project in public development. The core experience — player, library, playlists — works today.
            Features grow version by version with community feedback. Expect changes; report anything that feels off.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="surface-panel border rounded-2xl p-5">
            <h3 className="font-bold mb-3 text-lime">{t('available_now')}</h3>
            <ul className="text-sm text-mute space-y-1.5 list-disc pl-4">
              <li>{t('source_local')} (import, metadata, covers)</li>
              <li>{t('source_jamendo')}</li>
              <li>{t('nav_playlists')} · {t('nav_favorites')} · {t('queue')}</li>
              <li>{t('stats_title')} · {t('nav_get')}</li>
            </ul>
          </div>
          <div className="surface-panel border rounded-2xl p-5">
            <h3 className="font-bold mb-3 text-accentviolet">{t('in_development')}</h3>
            <ul className="text-sm text-mute space-y-1.5 list-disc pl-4">
              <li>Desktop builds (Tauri) — no binaries published yet</li>
              <li>Crossfade & audio equalizer</li>
              <li>Optional cloud sync (never required)</li>
              <li>More catalog providers</li>
            </ul>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="surface-panel border rounded-2xl p-6 mb-6">
          <h2 className="font-extrabold text-lg mb-4">{t('roadmap')}</h2>
          <div className="space-y-3">
            {[
              { v: '0.1', label: 'Core player + local library + Jamendo catalog', done: true },
              { v: '0.2', label: 'Smart playlists, better search, FLAC support polish', done: false },
              { v: '0.3', label: 'Desktop app beta (Tauri) for Windows/macOS/Linux', done: false },
            ].map((r) => (
              <div key={r.v} className="flex items-center gap-3">
                <span className={`w-8 text-xs font-bold ${r.done ? 'text-lime' : 'text-mute'}`}>{r.v}</span>
                <div className={`h-2 w-2 rounded-full ${r.done ? 'bg-lime' : 'bg-edge'}`} />
                <span className={`text-sm ${r.done ? 'text-ink' : 'text-mute'}`}>{r.label}{r.done && ' ✓'}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-mute mt-4">No fixed release dates — versions ship when they’re ready.</p>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="flex flex-wrap gap-3">
          <Btn primary onClick={() => navigate('/reven')}><Info size={15} /> {t('created_by')} {t('reven')}</Btn>
          <FeedbackButton />
        </div>
      </Reveal>
    </div>
  );
}

function FeedbackButton({ small }: { small?: boolean }) {
  const { t } = useT();
  const contacts = lsGet('contacts', { email: '', url: '' }) as { email: string; url: string };
  if (contacts.email || contacts.url) {
    return (
      <a href={contacts.email ? `mailto:${contacts.email}` : contacts.url}>
        <Btn small={small}><Mail size={15} /> {t('feedback')}</Btn>
      </a>
    );
  }
  return (
    <Btn small={small} onClick={() => alert('No feedback channel configured yet.\nAdd one in Settings → Creator links (stored locally only).')}>
      <Mail size={15} /> {t('feedback')}
    </Btn>
  );
}

/* ─────────────────────────── REVEN ─────────────────────────── */

export function RevenPage() {
  const { t } = useT();
  const contacts = lsGet('contacts', { email: '', github: '', site: '' }) as { email: string; github: string; site: string };

  return (
    <div className="px-4 md:px-8 py-10 max-w-[860px] mx-auto">
      <Reveal>
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold text-mute uppercase tracking-widest">
          Independent project <span className="text-edge">·</span> <EarlyBadge />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          {t('created_by')} <span className="text-lime">Reven</span>.
        </h1>
        <p className="text-mute text-lg mt-5 max-w-xl leading-relaxed">
          SONORA is an independent music experience built to make discovering and enjoying music feel personal again.
        </p>
        <p className="text-mute text-sm mt-2 max-w-xl leading-relaxed">
          SONORA es un proyecto musical independiente creado por Reven para ofrecer una forma más personal, visual y agradable de descubrir y disfrutar la música.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          <div className="surface-panel border rounded-2xl p-5 space-y-3">
            {[
              ['Name', 'Reven'], ['Role', 'Creator & Developer'], ['Project', 'SONORA'], ['Status', 'Early Access'], ['Version', APP_VERSION],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-mute">{k}</span><span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <div className="surface-panel border rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-3">Links</h3>
            {(!contacts.email && !contacts.github && !contacts.site) ? (
              <p className="text-xs text-mute leading-relaxed mb-3">
                No social or contact links have been configured yet. Reven can add them locally in Settings — they are never invented or filled automatically.
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.email && <a className="flex items-center gap-2 text-sm hover:text-lime" href={`mailto:${contacts.email}`}><Mail size={15} /> {contacts.email}</a>}
                {contacts.github && <a className="flex items-center gap-2 text-sm hover:text-lime" href={contacts.github} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>}
                {contacts.site && <a className="flex items-center gap-2 text-sm hover:text-lime" href={contacts.site} target="_blank" rel="noreferrer"><Link2 size={15} /> Website</a>}
              </div>
            )}
            <div className="mt-4"><FeedbackButton small /></div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-8 flex items-center gap-3 text-mute text-sm">
          <Logo small />
          <span>Your music. Your atmosphere. — {t('taglineAlt')}</span>
        </div>
      </Reveal>
    </div>
  );
}

/* ─────────────────────────── LISTENING STATS ─────────────────────────── */

export function StatsPage() {
  const { t } = useT();
  const lib = useLibrary();
  const { navigate } = useRouter();

  const data = useMemo(() => {
    const hist = lib.history;
    if (!hist.length) return null;
    const totalSec = hist.reduce((a, h) => a + h.listenedSec, 0);
    const byTrack = new Map<string, { plays: number; sec: number }>();
    const byArtist = new Map<string, number>();
    const week = [0, 0, 0, 0, 0, 0, 0]; // last 7 days seconds
    for (const h of hist) {
      const tr = lib.tracks[h.trackId];
      const bt = byTrack.get(h.trackId) ?? { plays: 0, sec: 0 };
      bt.plays++; bt.sec += h.listenedSec; byTrack.set(h.trackId, bt);
      if (tr) byArtist.set(tr.artist, (byArtist.get(tr.artist) ?? 0) + h.listenedSec);
      const daysAgo = Math.floor((Date.now() - h.at) / 86400000);
      if (daysAgo >= 0 && daysAgo < 7) week[6 - daysAgo] += h.listenedSec;
    }
    const topTracks = [...byTrack.entries()].sort((a, b) => b[1].sec - a[1].sec).slice(0, 6);
    const topArtists = [...byArtist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxWeek = Math.max(...week, 1);
    return { totalSec, topTracks, topArtists, week, maxWeek, sessions: hist.length };
  }, [lib.history, lib.tracks]);

  if (!data) {
    return (
      <div className="px-4 md:px-8 py-10 max-w-[900px] mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-3"><BarChart3 className="text-lime" size={26} /> {t('stats_title')}</h1>
        <EmptyState icon={<BarChart3 size={30} />} title={t('stats_empty')} sub={t('library_empty_sub')}
          action={<Btn primary onClick={() => navigate('/explore')}>{t('explore_catalog')}</Btn>} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1000px] mx-auto">
      <Reveal>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-3"><BarChart3 className="text-lime" size={26} /> {t('stats_title')}</h1>
        <p className="text-mute text-xs mb-6">Computed only from real playback in this browser. Nothing is uploaded.</p>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatBox label={t('listen_time')} value={fmtLongTime(data.totalSec, t('minutes'), t('hours'))} />
          <StatBox label={t('tracks')} value={String(new Set(lib.history.map((h) => h.trackId)).size)} />
          <StatBox label={t('times_played')} value={String(data.sessions)} />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="surface-panel border rounded-2xl p-5 mb-8">
          <h3 className="font-bold text-sm mb-4">{t('weekly_activity')}</h3>
          <div className="flex items-end gap-2 h-28">
            {data.week.map((sec, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-md bg-lime/80 transition-all" style={{ height: `${Math.max(4, (sec / data.maxWeek) * 100)}%`, minHeight: sec ? 6 : 2, opacity: sec ? 1 : 0.25 }} title={`${Math.round(sec / 60)} ${t('minutes')}`} />
                <span className="text-[10px] text-mute">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-6">
        <Reveal delay={0.15}>
          <SectionTitle title={t('top_artists')} />
          <div className="space-y-2">
            {data.topArtists.map(([name, sec], i) => (
              <Link key={name} to={`/artist/${encodeURIComponent(name)}`} className="flex items-center gap-3 surface-panel border rounded-xl px-3 py-2 hover:border-lime/40 transition-colors">
                <span className="text-lime font-extrabold w-5">{i + 1}</span>
                <span className="text-sm font-medium truncate flex-1">{name}</span>
                <span className="text-xs text-mute">{fmtLongTime(sec, t('minutes'), t('hours'))}</span>
              </Link>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <SectionTitle title={t('top_tracks')} />
          <div className="space-y-2">
            {data.topTracks.map(([id, s], i) => {
              const tr = lib.tracks[id];
              if (!tr) return null;
              return (
                <div key={id} className="flex items-center gap-3 surface-panel border rounded-xl px-3 py-2">
                  <span className="text-lime font-extrabold w-5">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{tr.title}</div>
                    <div className="text-xs text-mute truncate">{tr.artist}</div>
                  </div>
                  <span className="text-xs text-mute">{s.plays} × {t('times_played')}</span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-panel border rounded-2xl p-4">
      <div className="text-xs text-mute mb-1">{label}</div>
      <div className="text-xl font-extrabold text-lime">{value}</div>
    </div>
  );
}

/* ─────────────────────────── SETTINGS ─────────────────────────── */

export function SettingsPage() {
  const { t } = useT();
  const prefs = usePrefs();
  const lib = useLibrary();
  const { lang, setLang } = useT();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [jamendo, setJamendo] = useState(() => { try { return JSON.parse(localStorage.getItem('sonora:jamendo') || '{}'); } catch { return {}; } });
  const [contacts, setContacts] = useState(() => lsGet('contacts', { email: '', github: '', site: '' }) as { email: string; github: string; site: string });

  useEffect(() => { idbEstimate().then(setEstimate); }, [lib.tracks]);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: APP_VERSION, exportedAt: Date.now(), tracks: lib.tracks, playlists: lib.playlists, favorites: lib.favorites, history: lib.history }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sonora-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (f: File) => {
    try {
      const json = JSON.parse(await f.text());
      if (!json.tracks || !json.playlists) throw new Error('bad format');
      localStorage.setItem('sonora:tracks', JSON.stringify(json.tracks));
      localStorage.setItem('sonora:playlists', JSON.stringify(json.playlists));
      localStorage.setItem('sonora:favorites', JSON.stringify(json.favorites ?? []));
      localStorage.setItem('sonora:history', JSON.stringify(json.history ?? []));
      location.reload();
    } catch {
      alert('Invalid backup file.');
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-[760px] mx-auto pb-16">
      <Reveal><h1 className="text-3xl font-extrabold tracking-tight mb-6">{t('settings')}</h1></Reveal>

      <Reveal delay={0.05}>
        <SettingsGroup title={t('username')}>
          <Field label={t('username')}>
            <input className={inputCls} value={prefs.username} placeholder="Reven" onChange={(e) => prefs.setName(e.target.value)} />
          </Field>
        </SettingsGroup>
      </Reveal>

      <Reveal delay={0.1}>
        <SettingsGroup title={`${t('language')} · ${t('theme')}`}>
          <div className="flex gap-2">
            {(['en', 'es'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${lang === l ? 'border-lime text-lime' : 'border-edge text-mute hover:text-ink'}`}>
                {l === 'en' ? 'English' : 'Español'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            {(['dark', 'light'] as const).map((th) => (
              <button key={th} onClick={() => prefs.setTheme(th)} className={`px-4 py-2 rounded-lg text-sm font-semibold border capitalize transition-colors ${prefs.theme === th ? 'border-lime text-lime' : 'border-edge text-mute hover:text-ink'}`}>
                {t(th)}
              </button>
            ))}
          </div>
        </SettingsGroup>
      </Reveal>

      <Reveal delay={0.15}>
        <SettingsGroup title={t('source_jamendo')}>
          <Toggle label={t('online_badge')} checked={jamendo.enabled !== false} onChange={(v) => saveJam({ ...jamendo, enabled: v }, setJamendo)} />
          <Field label="client_id"><input className={inputCls} value={jamendo.clientId ?? ''} placeholder="your_client_id (optional)"
            onChange={(e) => setJamendo((j: object) => ({ ...j, clientId: e.target.value }))}
            onBlur={(e) => saveJam({ ...jamendo, clientId: e.target.value }, setJamendo)} /></Field>
          <p className="text-xs text-mute mt-2">{t('jamendo_attr')}</p>
        </SettingsGroup>
      </Reveal>

      <Reveal delay={0.18}>
        <SettingsGroup title="Creator links (local)">
          <Field label="Email"><input className={inputCls} value={contacts.email} placeholder="" onChange={(e) => saveContacts({ ...contacts, email: e.target.value }, setContacts)} /></Field>
          <Field label="GitHub / social URL"><input className={inputCls} value={contacts.github} placeholder="" onChange={(e) => saveContacts({ ...contacts, github: e.target.value }, setContacts)} /></Field>
          <Field label="Website URL"><input className={inputCls} value={contacts.site} placeholder="" onChange={(e) => saveContacts({ ...contacts, site: e.target.value }, setContacts)} /></Field>
        </SettingsGroup>
      </Reveal>

      <Reveal delay={0.2}>
        <SettingsGroup title={t('storage')}>
          <p className="text-sm text-mute mb-3">
            {Object.keys(lib.tracks).length} {t('total_tracks')} · {lib.playlists.length} {t('playlists_t')} ·{' '}
            {estimate != null ? `~${Math.round(estimate / 1048576)} MB used on this device` : 'storage estimate unavailable'}
          </p>
          <p className="text-xs text-mute mb-4">{t('offline_ready')} Audio files are stored in IndexedDB on this browser only — never uploaded.</p>
          <div className="flex flex-wrap gap-2">
            <Btn small onClick={exportData}><FileJson size={14} /> {t('export_lib')}</Btn>
            <Btn small onClick={() => fileRef.current?.click()}><Upload size={14} /> {t('import_lib')}</Btn>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); }} />
            <Btn small onClick={() => { if (confirm(t('clear_history') + '?')) lib.clearHistory(); }}><Trash2 size={14} /> {t('clear_history')}</Btn>
          </div>
        </SettingsGroup>
      </Reveal>

      <Reveal delay={0.25}>
        <SettingsGroup title={t('danger_zone')}>
          <Btn onClick={() => setWipeOpen(true)} className="!text-red-400"><Trash2 size={15} /> {t('wipe')}</Btn>
        </SettingsGroup>
      </Reveal>

      <Reveal delay={0.3}>
        <div className="text-xs text-mute mt-8 flex flex-wrap items-center gap-2">
          <Logo small /> SONORA {t('version')} {APP_VERSION} · <EarlyBadge /> · {t('created_by')} <Link to="/reven" className="text-lime hover:underline">{t('reven')}</Link>
        </div>
      </Reveal>

      <Modal open={wipeOpen} onClose={() => setWipeOpen(false)}>
        <h3 className="font-bold text-lg mb-2 text-red-400">{t('wipe')}</h3>
        <p className="text-sm text-mute mb-4">{t('wipe_confirm')}</p>
        <div className="flex justify-end gap-2">
          <Btn onClick={() => setWipeOpen(false)}>{t('cancel')}</Btn>
          <Btn className="!bg-red-500/20 !text-red-400" onClick={async () => { await lib.wipeAll(); setWipeOpen(false); location.reload(); }}>{t('confirm')}</Btn>
        </div>
      </Modal>
    </div>
  );
}

function saveJam(cfg: { clientId?: string; enabled?: boolean }, set: (o: object) => void) {
  localStorage.setItem('sonora:jamendo', JSON.stringify({ clientId: cfg.clientId || 'sonoraindex21', enabled: cfg.enabled !== false }));
  set({ clientId: cfg.clientId || 'sonoraindex21', enabled: cfg.enabled !== false });
}
function saveContacts(c: object, set: (o: object) => void) {
  localStorage.setItem('sonora:contacts', JSON.stringify(c));
  set(c);
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-panel border rounded-2xl p-5 mb-4">
      <h2 className="font-bold text-sm uppercase tracking-wider text-mute mb-4">{title}</h2>
      {children}
    </div>
  );
}

/* ─────────────────────────── ONBOARDING ─────────────────────────── */

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const prefs = usePrefs();
  const lib = useLibrary();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(prefs.username);

  const finish = (importDemo = false) => {
    if (name.trim()) prefs.setName(name.trim());
    prefs.finishOnboarding();
    if (importDemo) import('../services/demo').then((m) => m.installDemoLibrary()).catch(() => {});
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-base flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6"><Logo /></div>
        {step === 0 && (
          <div className="space-y-4 animate-[fadeIn_.4s_ease]">
            <h1 className="text-3xl font-extrabold tracking-tight">{t('onboarding_title')}</h1>
            <p className="text-mute leading-relaxed">{t('onboarding_sub')}</p>
            <div className="flex justify-center"><EarlyBadge /></div>
            <Btn primary onClick={() => setStep(1)}>{t('start')}</Btn>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4 text-left">
            <h2 className="text-xl font-extrabold text-center mb-2">{t('choose_name')}</h2>
            <input autoFocus className={inputCls} value={name} placeholder="Reven" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setStep(2)} />
            <div className="flex justify-between">
              <Btn onClick={() => setStep(2)}>{t('skip')}</Btn>
              <Btn primary onClick={() => setStep(2)}>{t('save')}</Btn>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3 text-left">
            <h2 className="text-xl font-extrabold text-center mb-2">{t('library_empty_sub')}</h2>
            <div className="surface-panel border rounded-xl p-4 hover:border-lime/40 cursor-pointer transition-colors" onClick={() => finish(false)}>
              <div className="font-bold text-sm">{t('import_music')}</div>
              <div className="text-mute text-xs mt-1">You can also do this later in Your Library.</div>
            </div>
            <div className="surface-panel border rounded-xl p-4 hover:border-lime/40 cursor-pointer transition-colors" onClick={() => finish(true)}>
              <div className="font-bold text-sm flex items-center gap-2">{t('explore_catalog')} <span className="text-[9px] font-bold bg-raised border rounded px-1.5 py-0.5 text-mute">DEMO DATA</span></div>
              <div className="text-mute text-xs mt-1">Load 4 original synthesized demo tracks to try the player instantly.</div>
            </div>
            <Btn className="w-full" onClick={() => finish(false)}>{t('start')}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
