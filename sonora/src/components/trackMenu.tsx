// SONORA — global track context menu + dialogs (queue, playlist, favorite, edit, remove).

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ListPlus, Play, Heart, Trash2, Info, PlusCircle, Pencil, Download, Check } from 'lucide-react';
import type { Track } from '../types/music';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { useUi } from '../store/ui';
import { useT } from '../i18n';
import { Modal, Field, inputCls, Btn } from './ui';
import { fmtTime } from '../utils/format';

interface MenuState { x: number; y: number; track: Track }

export function useTrackMenuOpener() {
  const set = (e: React.MouseEvent | MouseEvent, track: Track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('sonora:trackmenu', { detail: { x: e.clientX, y: e.clientY, track } }));
  };
  return set;
}

export function TrackMenuHost() {
  const { t } = useT();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [plTarget, setPlTarget] = useState<Track | null>(null);
  const [infoTarget, setInfoTarget] = useState<Track | null>(null);
  const [editTarget, setEditTarget] = useState<Track | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const lib = useLibrary();
  const player = usePlayer();
  const toast = useUi((s) => s.pushToast);

  useEffect(() => {
    const on = (e: Event) => setMenu((e as CustomEvent<MenuState>).detail);
    window.addEventListener('sonora:trackmenu', on);
    return () => window.removeEventListener('sonora:trackmenu', on);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    setTimeout(() => document.addEventListener('mousedown', close), 0);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const isFav = menu ? lib.favorites.includes(menu.track.id) : false;
  const inDownloads = menu ? lib.downloadedIds.includes(menu.track.id) : false;

  const item = (icon: React.ReactNode, label: string, fn: () => void, danger?: boolean) => (
    <button
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-raised transition-colors text-left ${danger ? 'text-red-400' : 'text-ink'}`}
      onClick={() => { fn(); setMenu(null); }}
    >
      <span className="text-mute">{icon}</span>{label}
    </button>
  );

  return (
    <>
      <AnimatePresence>
        {menu && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[70] surface-raised border rounded-xl shadow-pop p-1 w-56"
            style={{ left: Math.min(menu.x, window.innerWidth - 240), top: Math.min(menu.y, window.innerHeight - 320) }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {item(<Play size={15} />, t('play'), () => player.playContext([menu.track]))}
            {item(<ListPlus size={15} />, t('add_to_queue'), () => {
              player.addToQueue(menu.track);
              toast(t('add_to_queue') + ` · ${menu.track.title}`);
            })}
            {item(<Heart size={15} />, isFav ? t('unfavorite') : t('favorite'), () => {
              lib.toggleFavorite(menu.track.id);
              toast(isFav ? t('unfavorite') : `${t('favorite')} ♥ ${menu.track.title}`);
            })}
            {item(<PlusCircle size={15} />, t('add_to_playlist'), () => setPlTarget(menu.track))}
            {menu.track.source === 'local' && (
              item(inDownloads ? <Check size={15} /> : <Download size={15} />, inDownloads ? t('downloaded') : t('download'), () => {
                lib.toggleDownloaded(menu.track.id);
                toast(inDownloads ? t('remove') : t('downloaded'));
              })
            )}
            {menu.track.source === 'local' && !menu.track.sourceId.startsWith('demo:') && (
              item(<Pencil size={15} />, t('edit'), () => setEditTarget(menu.track))
            )}
            {item(<Info size={15} />, t('info'), () => setInfoTarget(menu.track))}
            {item(<Trash2 size={15} />, t('remove_from_library'), () => {
              lib.removeTrack(menu.track.id);
              toast(t('remove_from_library'), 'ok');
            }, true)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to playlist */}
      <Modal open={!!plTarget} onClose={() => setPlTarget(null)}>
        {plTarget && <AddToPlaylistBody track={plTarget} done={() => setPlTarget(null)} />}
      </Modal>

      {/* Track info */}
      <Modal open={!!infoTarget} onClose={() => setInfoTarget(null)}>
        {infoTarget && (
          <div>
            <h3 className="font-bold text-lg mb-3">{t('about_track')}</h3>
            <dl className="space-y-2 text-sm">
              {([['Title', infoTarget.title], [t('artists_t'), infoTarget.artist], [t('album_t'), infoTarget.album],
                 [t('duration'), fmtTime(infoTarget.durationSec)], [t('source'), infoTarget.source === 'local' ? t('source_local') : 'Jamendo'],
                 ...(infoTarget.genre ? [['Genre', infoTarget.genre]] : []),
                 ...(infoTarget.year ? [['Year', String(infoTarget.year)]] : []),
                 ...(infoTarget.license ? [[t('license'), infoTarget.license]] : [])] as [string, string][])
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-edge/50 pb-2">
                    <dt className="text-mute">{k}</dt><dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
      </Modal>

      {/* Edit local metadata */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)}>
        {editTarget && <EditMetaBody track={editTarget} done={() => setEditTarget(null)} />}
      </Modal>
    </>
  );
}

function AddToPlaylistBody({ track, done }: { track: Track; done: () => void }) {
  const { t } = useT();
  const playlists = useLibrary((s) => s.playlists);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const toast = useUi((s) => s.pushToast);
  const [newName, setNewName] = useState('');

  return (
    <div>
      <h3 className="font-bold text-lg mb-1">{t('add_to_playlist')}</h3>
      <p className="text-sm text-mute mb-4 truncate">{track.title} · {track.artist}</p>
      <div className="max-h-56 overflow-auto space-y-1 mb-4">
        {playlists.length === 0 && <p className="text-sm text-mute py-2">{t('playlist_empty')}</p>}
        {playlists.map((p) => (
          <button
            key={p.id}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-raised text-sm flex items-center justify-between group"
            onClick={() => {
              if (p.trackIds.includes(track.id)) toast(`«${p.name}» · ✓`);
              else { addToPlaylist(p.id, track.id); toast(`→ «${p.name}»`); }
              done();
            }}
          >
            <span className="truncate">{p.name}</span>
            <span className="text-xs text-mute">{p.trackIds.length} {t('total_tracks')}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder={t('create_playlist')} value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) { const p = createPlaylist(newName.trim()); addToPlaylist(p.id, track.id); toast(`+ «${p.name}»`); done(); } }} />
        <Btn primary small disabled={!newName.trim()} onClick={() => {
          const p = createPlaylist(newName.trim());
          addToPlaylist(p.id, track.id);
          toast(`+ «${p.name}»`);
          done();
        }}>{t('save')}</Btn>
      </div>
    </div>
  );
}

function EditMetaBody({ track, done }: { track: Track; done: () => void }) {
  const { t } = useT();
  const updateTrack = useLibrary((s) => s.updateTrack);
  const toast = useUi((s) => s.pushToast);
  const [f, setF] = useState({ title: track.title, artist: track.artist, album: track.album, genre: track.genre ?? '', year: track.year ? String(track.year) : '' });

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">{t('edit')} — {t('about_track')}</h3>
      <Field label="Title"><input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="Artist"><input className={inputCls} value={f.artist} onChange={(e) => setF({ ...f, artist: e.target.value })} /></Field>
      <Field label="Album"><input className={inputCls} value={f.album} onChange={(e) => setF({ ...f, album: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Genre"><input className={inputCls} value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })} /></Field>
        <Field label="Year"><input className={inputCls} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Btn small onClick={done}>{t('cancel')}</Btn>
        <Btn primary small onClick={() => {
          updateTrack(track.id, {
            title: f.title.trim() || track.title,
            artist: f.artist.trim() || track.artist,
            album: f.album.trim() || track.album,
            genre: f.genre.trim() || undefined,
            year: parseInt(f.year) || undefined,
          });
          toast(t('save') + ' ✓');
          done();
        }}>{t('save')}</Btn>
      </div>
    </div>
  );
}
