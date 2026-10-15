// SONORA i18n — lightweight typed dictionary system. Add languages by extending DICT.

import React, { createContext, useContext, useMemo } from 'react';
import { lsGet, lsSet } from '../services/db';

export type Lang = 'en' | 'es';

const en = {
  tagline: 'Your music. Your atmosphere.',
  taglineAlt: 'The music, your way.',
  nav_home: 'Home', nav_explore: 'Explore', nav_search: 'Search', nav_library: 'Your Library',
  nav_albums: 'Albums', nav_artists: 'Artists', nav_playlists: 'Playlists', nav_favorites: 'Favorites',
  nav_downloads: 'Downloads', nav_settings: 'Settings', nav_get: 'Get SONORA', nav_early: 'Early Access', nav_reven: 'Created by Reven', nav_stats: 'Listening Stats',
  welcome_morning: 'Good morning', welcome_afternoon: 'Good afternoon', welcome_evening: 'Good evening',
  welcome_sub: 'Your music was waiting for you.',
  continue_listening: 'Continue listening', made_for_mood: 'Made for your mood',
  discover_new: 'Discover something new', your_rotation: 'Your rotation', recently_added: 'Recently added',
  play: 'Play', pause: 'Pause', next: 'Next', previous: 'Previous', shuffle: 'Shuffle', repeat: 'Repeat',
  queue: 'Queue', add_to_queue: 'Add to queue', add_to_playlist: 'Add to playlist', favorite: 'Favorite',
  unfavorite: 'Remove favorite', remove_from_library: 'Remove from library', info: 'About this track',
  search_placeholder: 'What do you want to listen to?', search_all: 'All', tracks: 'Tracks', artists_t: 'Artists', albums_t: 'Albums', playlists_t: 'Playlists',
  no_results_title: 'Nothing matches that search.', no_results_sub: 'Try other keywords, or clear the search.', clear_search: 'Clear search',
  library_empty_title: 'Your library is waiting for its first track.',
  library_empty_sub: 'Import music you own, or explore the independent catalog.',
  import_music: 'Import music', explore_catalog: 'Explore catalog',
  create_playlist: 'Create playlist', playlist_empty: 'No songs yet. Add some and press play.',
  playlist_name: 'Playlist name', playlist_desc: 'Description (optional)', save: 'Save', cancel: 'Cancel', rename: 'Rename', edit: 'Edit', delete: 'Delete',
  mix: 'Mix', total_tracks: 'tracks', by: 'by', unknown_artist: 'Unknown artist',
  get_sonora: 'Get SONORA', get_sub: 'Your music, closer than ever.',
  install: 'Install SONORA', installing: 'Installing…', installed: 'SONORA is installed',
  desktop_soon: 'Desktop apps are coming soon.',
  early_access: 'EARLY ACCESS', created_by: 'Created by', reven: 'Reven',
  stats_title: 'Listening Stats', stats_empty: 'Start listening and your story will appear here.',
  settings: 'Settings', username: 'Display name', language: 'Language', theme: 'Theme', dark: 'Dark', light: 'Light',
  autoplay_next: 'Autoplay next track', crossfade_note: 'Playback volume', history: 'Listening history', clear_history: 'Clear history',
  storage: 'Storage', export_lib: 'Export library backup', import_lib: 'Import backup', danger_zone: 'Data & privacy',
  wipe: 'Erase all local data', wipe_confirm: 'This deletes your library, playlists and history from this browser. Are you sure?',
  version: 'Version', source_local: 'Local library', source_jamendo: 'Jamendo · independent catalog',
  online_badge: 'ONLINE', demo_badge: 'DEMO DATA',
  onboarding_title: 'Welcome to SONORA', onboarding_sub: 'An independent music experience. No account needed — everything stays in this browser.',
  choose_name: 'How should we call you?', skip: 'Skip', start: 'Start listening',
  first_playlist: 'Create your first atmosphere',
  queue_empty: 'Your queue is empty.', now_playing: 'Now playing', up_next: 'Up next',
  remove: 'Remove', drag_hint: 'Drag to reorder',
  follow: 'Follow', following: 'Following', play_all: 'Play all', add_library: 'Add to library', in_library: 'In your library',
  about_track: 'Track info', duration: 'Duration', source: 'Source', license: 'License', album_t: 'Album',
  error_load: 'This track could not be played.', expired: 'The stream link expired. Tap play again to refresh it.',
  feedback: 'Send feedback', roadmap: 'Roadmap', whats_new: "What's new", available_now: 'Available now', in_development: 'In development',
  listen_time: 'Listening time', top_artists: 'Top artists', top_tracks: 'Top tracks', weekly_activity: 'Weekly activity', history_entries: 'Recent activity', never_played: 'Never played', last_played: 'Last played', times_played: 'plays',
  minutes: 'min', hours: 'h', days: 'days', ago: 'ago', today: 'Today', new_week: 'New release',
  offline_ready: 'Main screens work offline once cached. Music sources depend on their own availability.',
  jamendo_attr: 'Music streaming provided by Jamendo — Creative Commons independent artists.',
  desc_edit: 'Edit details', cover: 'Cover', choose_image: 'Choose image', generated_cover: 'Generated from your tracks',
  sort_by: 'Sort by', sort_title: 'Title', sort_artist: 'Artist', sort_album: 'Album', sort_added: 'Date added', view_grid: 'Grid', view_list: 'List',
  downloaded: 'Saved for offline', download: 'Save for offline', downloads_page: 'Downloads', downloads_empty: 'Songs you save for offline playback will appear here.',
  mood_focus: 'Focus', mood_nightdrive: 'Night Drive', mood_chill: 'Chill', mood_energy: 'Energy', mood_melancholy: 'Melancholy', mood_latenight: 'Late Night', mood_deepwork: 'Deep Work', mood_sunday: 'Sunday Morning',
  confirm: 'Confirm', close: 'Close', loading: 'Loading…',
};

type Dict = typeof en;
type Key = keyof Dict;

const es: Dict = {
  tagline: 'Your music. Your atmosphere.',
  taglineAlt: 'La música, a tu manera.',
  nav_home: 'Inicio', nav_explore: 'Explorar', nav_search: 'Buscar', nav_library: 'Tu biblioteca',
  nav_albums: 'Álbumes', nav_artists: 'Artistas', nav_playlists: 'Playlists', nav_favorites: 'Favoritos',
  nav_downloads: 'Descargas', nav_settings: 'Ajustes', nav_get: 'Consigue SONORA', nav_early: 'Early Access', nav_reven: 'Creado por Reven', nav_stats: 'Estadísticas',
  welcome_morning: 'Buenos días', welcome_afternoon: 'Buenas tardes', welcome_evening: 'Buenas noches',
  welcome_sub: 'Tu música te estaba esperando.',
  continue_listening: 'Seguir escuchando', made_for_mood: 'Para tu estado de ánimo',
  discover_new: 'Descubre algo nuevo', your_rotation: 'Tu rotación', recently_added: 'Añadido recientemente',
  play: 'Reproducir', pause: 'Pausar', next: 'Siguiente', previous: 'Anterior', shuffle: 'Aleatorio', repeat: 'Repetir',
  queue: 'Cola', add_to_queue: 'Añadir a la cola', add_to_playlist: 'Añadir a playlist', favorite: 'Favorito',
  unfavorite: 'Quitar favorito', remove_from_library: 'Quitar de la biblioteca', info: 'Información de la pista',
  search_placeholder: '¿Qué quieres escuchar?', search_all: 'Todo', tracks: 'Canciones', artists_t: 'Artistas', albums_t: 'Álbumes', playlists_t: 'Playlists',
  no_results_title: 'Nada coincide con esa búsqueda.', no_results_sub: 'Prueba otras palabras o limpia la búsqueda.', clear_search: 'Limpiar búsqueda',
  library_empty_title: 'Tu biblioteca espera su primera canción.',
  library_empty_sub: 'Importa música propia o explora el catálogo independiente.',
  import_music: 'Importar música', explore_catalog: 'Explorar catálogo',
  create_playlist: 'Crear playlist', playlist_empty: 'Sin canciones todavía. Añade alguna y pulsa reproducir.',
  playlist_name: 'Nombre de la playlist', playlist_desc: 'Descripción (opcional)', save: 'Guardar', cancel: 'Cancelar', rename: 'Renombrar', edit: 'Editar', delete: 'Eliminar',
  mix: 'Mezclar', total_tracks: 'canciones', by: 'de', unknown_artist: 'Artista desconocido',
  get_sonora: 'Consigue SONORA', get_sub: 'Tu música, más cerca que nunca.',
  install: 'Instalar SONORA', installing: 'Instalando…', installed: 'SONORA está instalada',
  desktop_soon: 'Las apps de escritorio llegarán pronto.',
  early_access: 'EARLY ACCESS', created_by: 'Creado por', reven: 'Reven',
  stats_title: 'Estadísticas de escucha', stats_empty: 'Empieza a escuchar y tu historia aparecerá aquí.',
  settings: 'Ajustes', username: 'Nombre visible', language: 'Idioma', theme: 'Tema', dark: 'Oscuro', light: 'Claro',
  autoplay_next: 'Reproducir siguiente automáticamente', crossfade_note: 'Volumen de reproducción', history: 'Historial de escucha', clear_history: 'Borrar historial',
  storage: 'Almacenamiento', export_lib: 'Exportar copia de biblioteca', import_lib: 'Importar copia', danger_zone: 'Datos y privacidad',
  wipe: 'Borrar todos los datos locales', wipe_confirm: 'Elimina biblioteca, playlists e historial de este navegador. ¿Seguro?',
  version: 'Versión', source_local: 'Biblioteca local', source_jamendo: 'Jamendo · catálogo independiente',
  online_badge: 'ONLINE', demo_badge: 'DATOS DE PRUEBA',
  onboarding_title: 'Bienvenido a SONORA', onboarding_sub: 'Una experiencia musical independiente. Sin cuentas: todo se guarda en este navegador.',
  choose_name: '¿Cómo debemos llamarte?', skip: 'Omitir', start: 'Empezar a escuchar',
  first_playlist: 'Crea tu primera atmósfera',
  queue_empty: 'Tu cola está vacía.', now_playing: 'Sonando ahora', up_next: 'A continuación',
  remove: 'Quitar', drag_hint: 'Arrastra para reordenar',
  follow: 'Seguir', following: 'Siguiendo', play_all: 'Reproducir todo', add_library: 'Añadir a biblioteca', in_library: 'En tu biblioteca',
  about_track: 'Info de la pista', duration: 'Duración', source: 'Fuente', license: 'Licencia', album_t: 'Álbum',
  error_load: 'Esta pista no se pudo reproducir.', expired: 'El enlace caducó. Pulsa reproducir de nuevo para refrescarlo.',
  feedback: 'Enviar comentarios', roadmap: 'Hoja de ruta', whats_new: 'Novedades', available_now: 'Disponible ahora', in_development: 'En desarrollo',
  listen_time: 'Tiempo de escucha', top_artists: 'Artistas más escuchados', top_tracks: 'Canciones más escuchadas', weekly_activity: 'Actividad semanal', history_entries: 'Actividad reciente', never_played: 'Sin reproducir', last_played: 'Última reproducción', times_played: 'reproducciones',
  minutes: 'min', hours: 'h', days: 'días', ago: 'atrás', today: 'Hoy', new_week: 'Novedades',
  offline_ready: 'Las pantallas principales funcionan sin conexión una vez cacheadas. Las fuentes de música dependen de su disponibilidad.',
  jamendo_attr: 'Streaming cedido por Jamendo — artistas independientes bajo Creative Commons.',
  desc_edit: 'Editar detalles', cover: 'Portada', choose_image: 'Elegir imagen', generated_cover: 'Generada con tus canciones',
  sort_by: 'Ordenar por', sort_title: 'Título', sort_artist: 'Artista', sort_album: 'Álbum', sort_added: 'Fecha', view_grid: 'Cuadrícula', view_list: 'Lista',
  downloaded: 'Guardada sin conexión', download: 'Guardar sin conexión', downloads_page: 'Descargas', downloads_empty: 'Aquí aparecerán las canciones guardadas para oír sin conexión.',
  mood_focus: 'Focus', mood_nightdrive: 'Night Drive', mood_chill: 'Chill', mood_energy: 'Energy', mood_melancholy: 'Melancholy', mood_latenight: 'Late Night', mood_deepwork: 'Deep Work', mood_sunday: 'Sunday Morning',
  confirm: 'Confirmar', close: 'Cerrar', loading: 'Cargando…',
};

const DICTS: Record<Lang, Dict> = { en, es };

interface I18nCtx { lang: Lang; t: (k: Key) => string; setLang: (l: Lang) => void }
const Ctx = createContext<I18nCtx>({ lang: 'en', t: (k) => en[k], setLang: () => {} });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(() => lsGet('lang', 'en' as Lang));
  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      t: (k) => DICTS[lang][k] ?? en[k],
      setLang: (l) => { setLangState(l); lsSet('lang', l); },
    }),
    [lang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
export type { Key as TKey };
