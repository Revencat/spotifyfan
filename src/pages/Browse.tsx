// SONORA — Browse pages: playlist detail, album, artist, favorites, downloads.

import React, { useMemo, useRef, useState } from 'react';
import { Play, Shuffle, Heart, ListMusic, Download, Trash2, Pencil, ArrowLeft } from 'lucide-react';
import type { Track } from '../types/music';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useRouter, Link } from '../router';
import { useT } from '../i18n';
import { SectionTitle, TrackList, Shelf, MediaCard, Reveal, usePlayHelpers } from '../components/browse/common';
import { Cover, Btn, Modal, Field, inputCls, EmptyState, EarlyBadge, SourceBadge, Toggle } from '../components/ui';
import { generateCover } from '../services/artwork';
import { fmtLongTime, fmtTime, timeAgo } from '../utils/format';
import { useUi } from '../store/ui';

export function PlaylistPage({ id }: { id: string }) {
  const { t } = useT();
  const lib = useLibrary();
  const player = usePlayer();
  const { navigate } = useRouter();
  const { playIds } = usePlayHelpers();
  const pl = lib.playlists.find((p) => p.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const tracks = useMemo(() => (pl?.trackIds ?? []).map((tid) => lib.tracks[tid]).filter(Boolean) as Track[], [pl, lib.tracks]);
  const total = tracks.reduce((a, tr) => a + tr.durationSec, 0);

  if (!pl) return <EmptyState icon={<ListMusic size={30} />} title={t('playlist_empty')} action={<Btn onClick={() => navigate('/library')}>{t('nav_playlists')}</Btn>} />;

  const cover = pl.coverUrl || generateCover(pl.id + pl.name);

  return (
    <div className="px-4 md:px-8 pb-10 max-w-[1200px] mx-auto">
      <button onClick={() => history.back()} className="text-mute hover:text-ink flex items-center gap-1 text-sm mt-4 mb-4"><ArrowLeft size={16} /> {t('nav_library')}</button>
      <Reveal>
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
          <img src={cover} alt="" className="w-44 h-44 md:w-52 md:h-52 rounded-xl shadow-card object-cover" />
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-lime mb-2">{t('playlists_t')}</div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight break-words">{pl.name}</h1>
            {pl.description && <p className="text-mute text-sm mt-2">{pl.description}</p>}
            <p className="text-mute text-xs mt-3">
              {tracks.length} {t('total_tracks')} · {fmtLongTime(total, t('minutes'), t('hours'))} · {timeAgo(pl.createdAt, t('days'), t('ago'), t('today'))}
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Btn primary onClick={() => playIds(pl.trackIds)} disabled={!tracks.length}><Play size={16} /> {t('play_all')}</Btn>
              <Btn onClick={() => playIds(pl.trackIds, true)} disabled={!tracks.length}><Shuffle size={15} /> {t('mix')}</Btn>
              <Btn small onClick={() => setEditOpen(true)}><Pencil size={14} /> {t('edit')}</Btn>
              <Btn small onClick={() => lib.updatePlaylist(pl.id, { favorite: !pl.favorite })}>
                <Heart size={14} className={pl.favorite ? 'fill-lime text-lime' : ''} /> {pl.favorite ? t('following') : t('favorite')}
              </Btn>
            </div>
          </div>
        </div>
      </Reveal>

      {tracks.length === 0 ? (
        <EmptyState icon={<ListMusic size={30} />} title={t('playlist_empty')} sub={t('library_empty_sub')}
          action={<Btn primary onClick={() => navigate('/explore')}>{t('explore_catalog')}</Btn>} />
      ) : (
        <TrackList tracks={tracks} contextBase={tracks} editable
          onRemove={(i) => lib.removeFromPlaylist(pl.id, i)}
          onReorder={(from, to) => lib.reorderPlaylist(pl.id, from, to)} />
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <EditPlaylistForm pl={pl} onDone={() => setEditOpen(false)} />
      </Modal>
    </div>
  );
}

function EditPlaylistForm({ pl, onDone }: { pl: { id: string; name: string; description?: string; coverUrl?: string }; onDone: () => void }) {
  const { t } = useT();
  const lib = useLibrary();
  const ui = useUi();
  const [name, setName] = useState(pl.name);
  const [desc, setDesc] = useState(pl.description ?? '');
  const [cover, setCover] = useState<string | undefined>(pl.coverUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">{t('desc_edit')}</h3>
      <Field label={t('playlist_name')}><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label={t('playlist_desc')}><textarea className={inputCls} rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
      <Field label={t('cover')}>
        <div className="flex items-center gap-3">
          <img src={cover || generateCover(pl.id + pl.name)} alt="" className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex flex-col gap-1.5">
            <Btn small onClick={() => fileRef.current?.click()}>{t('choose_image')}</Btn>
            {cover && <Btn small onClick={() => setCover(undefined)}>{t('generated_cover')}</Btn>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => setCover(String(r.result));
                r.readAsDataURL(f);
              }} />
        </div>
      </Field>
      <div className="flex justify-between pt-2">
        <Btn onClick={() => { if (confirm(t('delete') + '?')) { lib.deletePlaylist(pl.id); onDone(); navigateAfter(); } }}>
          <Trash2 size={14} className="text-red-400" /> {t('delete')}
        </Btn>
        <div className="flex gap-2">
          <Btn onClick={onDone}>{t('cancel')}</Btn>
          <Btn primary onClick={() => {
            if (!name.trim()) { ui.pushToast(t('playlist_name'), 'error'); return; }
            lib.updatePlaylist(pl.id, { name: name.trim(), description: desc.trim() || undefined, coverUrl: cover });
            ui.pushToast(t('save'));
            onDone();
          }}>{t('save')}</Btn>
        </div>
      </div>
    </div>
  );
}
function navigateAfter() { location.hash = '#/library'; }

export function AlbumPage({ albumKey }: { albumKey: string }) {
  const { t } = useT();
  const lib = useLibrary();
  const { navigate } = useRouter();
  const { playIds } = usePlayHelpers();
  const album = lib.getAlbum(decodeURIComponent(albumKey));
  if (!album) return <EmptyState icon={<ListMusic size={30} />} title={t('no_results_title')} action={<Btn onClick={() => navigate('/albums')}>{t('albums_t')}</Btn>} />;
  const tracks = album.trackIds.map((id) => lib.tracks[id]).filter(Boolean) as Track[];
  const total = tracks.reduce((a, tr) => a + tr.durationSec, 0);
  const inLib = true;

  return (
    <div className="px-4 md:px-8 pb-10 max-w-[1200px] mx-auto">
      <button onClick={() => history.back()} className="text-mute hover:text-ink flex items-center gap-1 text-sm mt-4 mb-4"><ArrowLeft size={16} /> {t('albums_t')}</button>
      <Reveal>
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
          <img src={album.coverUrl || generateCover(album.key)} alt="" className="w-44 h-44 md:w-52 md:h-52 rounded-xl shadow-card object-cover" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime mb-2">{t('album_t')}</div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{album.title}</h1>
            <Link to={`/artist/${encodeURIComponent(album.artist)}`} className="text-sm text-mute hover:text-ink underline-offset-2 hover:underline">{album.artist}</Link>
            <p className="text-mute text-xs mt-3">
              {album.year ? `${album.year} · ` : ''}{tracks.length} {t('total_tracks')} · {fmtLongTime(total, t('minutes'), t('hours'))}
            </p>
            <div className="flex gap-2 mt-5">
              <Btn primary onClick={() => playIds(album.trackIds)}><Play size={16} /> {t('play_all')}</Btn>
              <Btn onClick={() => playIds(album.trackIds, true)}><Shuffle size={15} /> {t('mix')}</Btn>
              <Btn small disabled={inLib}>{t('in_library')}</Btn>
            </div>
          </div>
        </div>
      </Reveal>
      <TrackList tracks={tracks} contextBase={tracks} />
    </div>
  );
}

export function ArtistPage({ name }: { name: string }) {
  const { t } = useT();
  const lib = useLibrary();
  const { navigate } = useRouter();
  const { playIds } = usePlayHelpers();
  const artistName = decodeURIComponent(name);
  const artist = lib.getArtist(artistName);
  if (!artist) return <EmptyState icon={<ListMusic size={30} />} title={t('no_results_title')} action={<Btn onClick={() => navigate('/artists')}>{t('artists_t')}</Btn>} />;
  const followed = lib.followedArtists.includes(artist.name);
  const tracks = artist.trackIds.map((id) => lib.tracks[id]).filter(Boolean) as Track[];
  const albums = artist.albumKeys.map((k) => lib.getAlbum(k)).filter(Boolean);
  const plays = lib.history.filter((h) => artist.trackIds.includes(h.trackId)).length;

  return (
    <div className="px-4 md:px-8 pb-10 max-w-[1200px] mx-auto">
      <button onClick={() => history.back()} className="text-mute hover:text-ink flex items-center gap-1 text-sm mt-4 mb-4"><ArrowLeft size={16} /> {t('artists_t')}</button>
      <Reveal>
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
          <img src={artist.coverUrl || generateCover('artist|' + artist.name)} alt="" className="w-44 h-44 rounded-full shadow-card object-cover" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-lime mb-2">{t('artists_t')}</div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{artist.name}</h1>
            {plays > 0 && <p className="text-mute text-xs mt-2">{plays} × {t('times_played')}</p>}
            <div className="flex gap-2 mt-5">
              <Btn primary onClick={() => playIds(artist.trackIds)}><Play size={16} /> {t('play_all')}</Btn>
              <Btn onClick={() => playIds(artist.trackIds, true)}><Shuffle size={15} /> {t('mix')}</Btn>
              <Btn small onClick={() => lib.toggleFollowArtist(artist.name)}>
                <Heart size={14} className={followed ? 'fill-lime text-lime' : ''} /> {followed ? t('following') : t('follow')}
              </Btn>
            </div>
          </div>
        </div>
      </Reveal>

      {albums.length > 0 && (
        <Reveal>
          <SectionTitle title={t('albums_t')} />
          <Shelf>
            {albums.map((a) => (
              <MediaCard key={a!.key} label={a!.title} sub={a!.artist} to={`/album/${encodeURIComponent(a!.key)}`}
                track={lib.tracks[a!.trackIds[0]]} contextTracks={a!.trackIds.map((id) => lib.tracks[id]).filter(Boolean) as Track[]} />
            ))}
          </Shelf>
        </Reveal>
      )}

      <Reveal>
        <SectionTitle title={t('tracks')} />
        <TrackList tracks={tracks} contextBase={tracks} />
      </Reveal>
    </div>
  );
}

export function FavoritesPage() {
  const { t } = useT();
  const lib = useLibrary();
  const { navigate } = useRouter();
  const { playIds } = usePlayHelpers();
  const tracks = lib.favorites.map((id) => lib.tracks[id]).filter(Boolean) as Track[];
  const total = tracks.reduce((a, tr) => a + tr.durationSec, 0);

  return (
    <div className="px-4 md:px-8 pb-10 max-w-[1200px] mx-auto">
      <Reveal>
        <div className="flex items-center gap-4 mb-6 mt-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-lime to-altlime flex items-center justify-center shadow-card">
            <Heart size={34} className="text-black" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t('nav_favorites')}</h1>
            <p className="text-mute text-xs mt-1">{tracks.length} {t('total_tracks')} · {fmtLongTime(total, t('minutes'), t('hours'))}</p>
          </div>
        </div>
      </Reveal>
      {tracks.length === 0 ? (
        <EmptyState icon={<Heart size={30} />} title={t('library_empty_title')} sub={t('library_empty_sub')}
          action={<Btn primary onClick={() => navigate('/explore')}>{t('explore_catalog')}</Btn>} />
      ) : (
        <>
          <div className="mb-4"><Btn primary onClick={() => playIds(tracks.map((x) => x.id))}><Play size={16} /> {t('play_all')}</Btn></div>
          <TrackList tracks={tracks} contextBase={tracks} />
        </>
      )}
    </div>
  );
}

export function DownloadsPage() {
  const { t } = useT();
  const lib = useLibrary();
  const { navigate } = useRouter();
  const tracks = lib.downloadedIds.map((id) => lib.tracks[id]).filter(Boolean) as Track[];

  return (
    <div className="px-4 md:px-8 pb-10 max-w-[1200px] mx-auto">
      <Reveal>
        <div className="flex items-center gap-3 mb-2 mt-4">
          <Download className="text-lime" size={26} />
          <h1 className="text-3xl font-extrabold tracking-tight">{t('downloads_page')}</h1>
        </div>
        <p className="text-mute text-sm mb-6">{t('offline_ready')}</p>
      </Reveal>
      {tracks.length === 0 ? (
        <EmptyState icon={<Download size={30} />} title={t('downloads_empty')}
          action={<Btn primary onClick={() => navigate('/library')}>{t('nav_library')}</Btn>} />
      ) : (
        <TrackList tracks={tracks} contextBase={tracks} />
      )}
      <Reveal>
        <div className="mt-8 surface-panel border rounded-xl p-5">
          <h3 className="font-bold mb-2">{t('get_sonora')}</h3>
          <p className="text-mute text-sm mb-3">{t('get_sub')}</p>
          <Btn primary onClick={() => navigate('/get')}>{t('install')}</Btn>
        </div>
      </Reveal>
    </div>
  );
}
