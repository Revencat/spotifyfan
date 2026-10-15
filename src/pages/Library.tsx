// SONORA — Your Library: grid/list, filters, sorting, real actions.

import React, { useMemo, useRef, useState } from 'react';
import { Upload, LayoutGrid, List, Music2, Plus } from 'lucide-react';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUi } from '../store/ui';
import { useT } from '../i18n';
import { EmptyState, Btn, Cover, PlayButton, Modal, Field, inputCls } from '../components/ui';
import { Chips, SectionTitle } from '../components/browse/common';
import { useTrackMenuOpener } from '../components/trackMenu';
import type { Track } from '../types/music';
import { fmtTime } from '../utils/format';
import { Link } from '../router';

type Filter = 'all' | 'tracks' | 'albums' | 'artists' | 'playlists' | 'favorites' | 'recent' | 'offline';
type Sort = 'title' | 'artist' | 'album' | 'added';

export function LibraryPage() {
  const { t } = useT();
  const lib = useLibrary();
  const player = usePlayer();
  const toast = useUi((s) => s.pushToast);
  const openMenu = useTrackMenuOpener();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('added');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [newPl, setNewPl] = useState(false);
  const [plName, setPlName] = useState('');

  const tracks = useMemo(() => {
    let list = Object.values(lib.tracks);
    if (filter === 'favorites') list = list.filter((tr) => lib.favorites.includes(tr.id));
    if (filter === 'recent') list = list.filter((tr) => Date.now() - tr.addedAt < 7 * 86400000);
    if (filter === 'offline') list = list.filter((tr) => tr.source === 'local');
    const cmp = (a: Track, b: Track) => {
      switch (sort) {
        case 'title': return a.title.localeCompare(b.title);
        case 'artist': return a.artist.localeCompare(b.artist);
        case 'album': return a.album.localeCompare(b.album);
        case 'added': default: return b.addedAt - a.addedAt;
      }
    };
    return [...list].sort(cmp);
  }, [lib.tracks, lib.favorites, filter, sort]);

  const albums = useMemo(() => (filter === 'albums' ? lib.albums() : []), [lib, filter]);
  const artists = useMemo(() => (filter === 'artists' ? lib.artists() : []), [lib, filter]);
  const showPlaylists = filter === 'all' || filter === 'playlists';
  const showTracks = filter === 'all' || filter === 'tracks' || filter === 'favorites' || filter === 'recent' || filter === 'offline';

  const onImport = async (files: FileList | null) => {
    if (!files?.length) return;
    const res = await lib.importFiles(Array.from(files));
    toast(res.added.length ? `${res.added.length} ${t('tracks').toLowerCase()} ✓` : t('error_load'), res.added.length ? 'ok' : 'error');
  };

  const empty = !tracks.length && !albums.length && !artists.length && !(showPlaylists && lib.playlists.length);

  return (
    <div className="px-4 md:px-6 py-6">
      <SectionTitle title={t('nav_library')} action={
        <div className="flex gap-2">
          <Btn small onClick={() => setNewPl(true)}><Plus size={14} />{t('create_playlist')}</Btn>
          <Btn small primary onClick={() => fileRef.current?.click()}><Upload size={14} />{t('import_music')}</Btn>
        </div>
      } />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Chips<Filter>
          value={filter} onChange={setFilter}
          options={[
            { v: 'all', label: t('search_all') }, { v: 'tracks', label: t('tracks') },
            { v: 'albums', label: t('albums_t') }, { v: 'artists', label: t('artists_t') },
            { v: 'playlists', label: t('playlists_t') }, { v: 'favorites', label: t('nav_favorites') },
            { v: 'recent', label: t('recently_added') }, { v: 'offline', label: t('downloaded') },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-mute">{t('sort_by')}</label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-raised border border-edge rounded-lg text-xs px-2 py-1.5 outline-none">
            <option value="added">{t('sort_added')}</option><option value="title">{t('sort_title')}</option>
            <option value="artist">{t('sort_artist')}</option><option value="album">{t('sort_album')}</option>
          </select>
          <div className="flex rounded-lg overflow-hidden border border-edge">
            <button aria-label={t('view_grid')} onClick={() => setView('grid')} className={`p-1.5 ${view === 'grid' ? 'bg-raised text-lime' : 'text-mute'}`}><LayoutGrid size={15} /></button>
            <button aria-label={t('view_list')} onClick={() => setView('list')} className={`p-1.5 ${view === 'list' ? 'bg-raised text-lime' : 'text-mute'}`}><List size={15} /></button>
          </div>
        </div>
      </div>

      {empty ? (
        <EmptyState icon={<Music2 size={34} />} title={t('library_empty_title')} sub={t('library_empty_sub')}
          action={<>
            <Btn primary onClick={() => fileRef.current?.click()}><Upload size={15} />{t('import_music')}</Btn>
            <Link to="/explore"><Btn>{t('explore_catalog')}</Btn></Link>
          </>} />
      ) : (
        <>
          {showPlaylists && lib.playlists.length > 0 && (
            <div className="mb-6">
              {filter === 'all' && <h3 className="text-sm font-bold uppercase tracking-widest text-mute mb-3">{t('playlists_t')}</h3>}
              <div className={`grid ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1'} gap-3`}>
                {lib.playlists.map((p) => (
                  <Link key={p.id} to={`/playlist/${p.id}`} className={`surface-panel border rounded-xl card-hover ${view === 'list' ? 'flex items-center gap-3 p-3' : 'p-3'}`}>
                    {view === 'grid' ? <PlaylistCover p={p} /> : <PlaylistCover p={p} size={44} rounded="rounded-lg" />}
                    <div className={view === 'grid' ? 'mt-2.5' : 'min-w-0 flex-1'}>
                      <div className="font-semibold text-sm truncate">{p.name}</div>
                      <div className="text-xs text-mute">{p.trackIds.length} {t('total_tracks')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filter === 'albums' && (
            <div className={`grid ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1'} gap-3 mb-6`}>
              {albums.map((a) => (
                <Link key={a.key} to={`/album/${encodeURIComponent(a.key)}`} className={`surface-panel border rounded-xl card-hover ${view === 'list' ? 'flex items-center gap-3 p-3' : 'p-3'}`}>
                  <Cover track={lib.tracks[a.trackIds[0]]} size={view === 'grid' ? 200 : 44} className={view === 'grid' ? 'w-full aspect-square rounded-lg' : ''} />
                  <div className={view === 'grid' ? 'mt-2.5' : 'min-w-0 flex-1'}>
                    <div className="font-semibold text-sm truncate">{a.title}</div>
                    <div className="text-xs text-mute truncate">{a.artist} · {a.trackIds.length} {t('total_tracks')}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filter === 'artists' && (
            <div className={`grid ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1'} gap-3 mb-6`}>
              {artists.map((a) => (
                <Link key={a.name} to={`/artist/${encodeURIComponent(a.name)}`} className={`surface-panel border rounded-xl card-hover p-3 ${view === 'list' ? 'flex items-center gap-3' : 'text-center'}`}>
                  <span className={`${view === 'grid' ? 'w-24 h-24 mx-auto' : 'w-11 h-11'} rounded-full bg-gradient-to-br from-lime/50 to-electric/40 grid place-items-center font-black text-black text-lg shrink-0`}>{a.name[0]}</span>
                  <div className={view === 'grid' ? 'mt-2.5' : 'min-w-0 flex-1'}>
                    <div className="font-semibold text-sm truncate">{a.name}</div>
                    <div className="text-xs text-mute">{a.trackIds.length} {t('total_tracks')}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {showTracks && (
            <div>
              {filter === 'all' && <h3 className="text-sm font-bold uppercase tracking-widest text-mute mb-3">{t('tracks')}</h3>}
              {tracks.length === 0 ? (
                <p className="text-sm text-mute py-8 text-center">{"Your next favorite song is out there." /* brand voice */}</p>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {tracks.map((tr) => (
                    <div key={tr.id} className="surface-panel border rounded-xl p-3 card-hover group relative" onContextMenu={(e) => openMenu(e, tr)}>
                      <Cover track={tr} size={200} className="w-full aspect-square rounded-lg" />
                      <div className="absolute left-5 bottom-[92px] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                        <PlayButton playing={player.current?.id === tr.id && player.isPlaying} label={t('play')} onClick={() => player.playContext(tracks, tracks.indexOf(tr))} size={40} />
                      </div>
                      <div className="mt-2.5 font-semibold text-sm truncate">{tr.title}</div>
                      <div className="text-xs text-mute truncate">{tr.artist}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-panel border rounded-2xl overflow-hidden divide-y divide-edge/40">
                  {tracks.map((tr) => (
                    <div key={tr.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-raised cursor-pointer transition-colors"
                      onClick={() => player.playContext(tracks, tracks.indexOf(tr))}
                      onContextMenu={(e) => openMenu(e, tr)}>
                      <Cover track={tr} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate ${player.current?.id === tr.id ? 'text-lime' : ''}`}>{tr.title}</div>
                        <div className="text-xs text-mute truncate">{tr.artist} · {tr.album}</div>
                      </div>
                      <span className="text-xs text-mute tabular-nums hidden sm:block">{fmtTime(tr.durationSec)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <input ref={fileRef} type="file" accept=".mp3,.wav,.ogg,.flac,audio/*" multiple hidden onChange={(e) => onImport(e.target.files)} />

      <Modal open={newPl} onClose={() => setNewPl(false)}>
        <h3 className="font-bold text-lg mb-3">{t('create_playlist')}</h3>
        <Field label={t('playlist_name')}>
          <input autoFocus className={inputCls} value={plName} onChange={(e) => setPlName(e.target.value)}
            placeholder="Night Drive…" onKeyDown={(e) => { if (e.key === 'Enter' && plName.trim()) { const p = lib.createPlaylist(plName.trim()); setNewPl(false); setPlName(''); toast(`+ «${p.name}»`); location.hash = '#/playlist/' + p.id; } }} />
        </Field>
        <div className="flex justify-end gap-2">
          <Btn small onClick={() => setNewPl(false)}>{t('cancel')}</Btn>
          <Btn primary small disabled={!plName.trim()} onClick={() => {
            const p = lib.createPlaylist(plName.trim());
            setNewPl(false); setPlName('');
            toast(`+ «${p.name}»`);
            location.hash = '#/playlist/' + p.id;
          }}>{t('save')}</Btn>
        </div>
      </Modal>
    </div>
  );
}

/** Playlist cover: user image or generated collage of first covers */
export function PlaylistCover({ p, size = 200, rounded = 'rounded-xl' }: { p: { id: string; name: string; coverUrl?: string; trackIds: string[] }; size?: number; rounded?: string }) {
  const lib = useLibrary();
  const first = lib.tracks[p.trackIds[0]];
  const src = p.coverUrl || first?.coverUrl;
  if (src) return <img src={src} alt="" style={{ width: size === 200 ? undefined : size, height: size === 200 ? undefined : size }} className={`${size === 200 ? 'w-full aspect-square' : ''} ${rounded} object-cover`} />;
  // collage
  const covers = p.trackIds.slice(0, 4).map((id) => lib.tracks[id]?.coverUrl).filter(Boolean) as string[];
  return (
    <div className={`grid grid-cols-2 ${size === 200 ? 'w-full aspect-square' : ''} ${rounded} overflow-hidden bg-raised`} style={size !== 200 ? { width: size, height: size } : undefined}>
      {(covers.length ? covers : ['', '', '', '']).slice(0, 4).map((c, i) => (
        c ? <img key={i} src={c} alt="" className="w-full h-full object-cover" /> : <div key={i} className="bg-gradient-to-br from-violet/30 to-lime/20" />
      ))}
    </div>
  );
}
