// SONORA — Explore: independent catalog (Jamendo) + mood shelves.

import React, { useEffect, useState } from 'react';
import { Compass, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Track } from '../types/music';
import { fetchJamendoMood, searchJamendo, getJamendoConfig, MOOD_QUERIES } from '../services/jamendo';
import { usePlayer } from '../store/player';
import { useRouter } from '../router';
import { useT } from '../i18n';
import { SectionTitle, Shelf, MediaCard, Reveal, Chips } from '../components/browse/common';
import { EmptyState, Btn, EarlyBadge, SourceBadge } from '../components/ui';
import { Cover } from '../components/ui';

const MOODS = Object.keys(MOOD_QUERIES);

export function ExplorePage() {
  const { t } = useT();
  const player = usePlayer();
  const { navigate } = useRouter();
  const [mood, setMood] = useState<string>('focus');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const cfg = getJamendoConfig();

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetchJamendoMood(mood)
      .then((r) => { if (!alive) return; setTracks(r); setStatus(r.length ? 'ok' : 'error'); })
      .catch(() => alive && setStatus('error'));
    return () => { alive = false; };
  }, [mood]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      <Reveal>
        <div className="flex items-center gap-3 mb-1">
          <Compass className="text-lime" size={26} />
          <h1 className="text-3xl font-extrabold tracking-tight">{t('nav_explore')}</h1>
          <EarlyBadge />
        </div>
        <p className="text-mute text-sm mb-5 flex items-center gap-2">
          {t('source_jamendo')} <SourceBadge track={{ id: '', source: 'jamendo', sourceId: '', title: '', artist: '', album: '', durationSec: 0, addedAt: 0 } as Track} />
        </p>
      </Reveal>

      {!cfg.enabled && (
        <EmptyState
          icon={<AlertTriangle size={30} />}
          title={t('source_jamendo')}
          sub={t('offline_ready')}
          action={<Btn onClick={() => navigate('/settings')}>{t('settings')}</Btn>}
        />
      )}

      {cfg.enabled && (
        <>
          <Chips
            options={MOODS.map((m) => ({ v: m, label: t(('mood_' + m) as never) }))}
            value={mood}
            onChange={setMood}
          />
          <div className="mt-6">
            {status === 'loading' && (
              <Shelf>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-3 -m-1"><div className="aspect-square rounded-xl bg-raised animate-pulse" /><div className="h-3 w-3/4 rounded bg-raised animate-pulse mt-3" /></div>
                ))}
              </Shelf>
            )}
            {status === 'error' && (
              <EmptyState
                icon={<AlertTriangle size={30} />}
                title={t('error_load')}
                sub={t('offline_ready')}
                action={<Btn primary onClick={() => setMood((m) => { fetchJamendoMood(m).then((r) => { setTracks(r); setStatus(r.length ? 'ok' : 'error'); }); return m; })}><RefreshCw size={14} className="mr-1.5 inline" />{t('loading')}</Btn>}
              />
            )}
            {status === 'ok' && tracks.length > 0 && (
              <>
                <SectionTitle title={t(('mood_' + mood) as never)} action={<Btn small primary onClick={() => player.playContext(tracks)}>▶ {t('play_all')}</Btn>} />
                <Shelf>
                  {tracks.map((tr) => (
                    <MediaCard key={tr.id} track={tr} label={tr.title} sub={tr.artist} contextTracks={tracks} />
                  ))}
                </Shelf>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SearchPage() {
  const { t } = useT();
  const { route, navigate } = useRouter();
  const q = route.params.q ?? '';
  const [results, setResults] = useState<Track[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>(q ? 'loading' : 'idle');
  const [filter, setFilter] = useState<'all' | 'local' | 'online'>('all');

  useEffect(() => {
    if (!q.trim()) { setResults([]); setStatus('idle'); return; }
    setStatus('loading');
    let alive = true;
    const timer = setTimeout(() => {
      // Local matches
      const needle = q.toLowerCase();
      const local = Object.values(JSON.parse(localStorage.getItem('sonora:tracks') || '{}')) as Track[];
      const localHits = local.filter((tr) =>
        tr.title.toLowerCase().includes(needle) || tr.artist.toLowerCase().includes(needle) || tr.album.toLowerCase().includes(needle));
      searchJamendo(q)
        .then((online) => { if (alive) { setResults([...localHits, ...online]); setStatus('ok'); } })
        .catch(() => { if (alive) { setResults(localHits); setStatus(localHits.length ? 'ok' : 'error'); } });
    }, 350);
    return () => { alive = false; clearTimeout(timer); };
  }, [q]);

  const shown = results.filter((r) => filter === 'all' || r.source === filter);

  return (
    <div className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
      <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget as HTMLFormElement).get('q') as string; navigate(`/search?q=${encodeURIComponent(v)}`); }}
        className="flex gap-2 mb-5">
        <input name="q" defaultValue={q} autoFocus placeholder={t('search_placeholder')} aria-label={t('nav_search')}
          className="flex-1 surface-raised border rounded-full px-5 py-3 text-sm outline-none focus:border-lime transition-colors" />
        <Btn primary type="submit">{t('nav_search')}</Btn>
      </form>

      {q && (
        <Chips
          options={[{ v: 'all', label: t('search_all') }, { v: 'local', label: t('source_local') }, { v: 'online', label: t('online_badge') }]}
          value={filter} onChange={setFilter}
        />
      )}

      <div className="mt-6">
        {status === 'idle' && <EmptyState icon={<Compass size={30} />} title={t('no_results_sub')} />}
        {status === 'loading' && <p className="text-mute text-sm animate-pulse">{t('loading')}</p>}
        {(status === 'error' || (status === 'ok' && !shown.length)) && (
          <EmptyState icon={<Compass size={30} />} title={t('no_results_title')} sub={t('no_results_sub')}
            action={<Btn onClick={() => navigate('/search')}>{t('clear_search')}</Btn>} />
        )}
        {status === 'ok' && shown.length > 0 && (
          <Shelf>
            {shown.map((tr) => <MediaCard key={tr.id} track={tr} label={tr.title} sub={`${tr.artist} · ${tr.source === 'jamendo' ? t('online_badge') : t('source_local')}`} contextTracks={shown} />)}
          </Shelf>
        )}
      </div>
    </div>
  );
}
