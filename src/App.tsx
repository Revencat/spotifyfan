// SONORA — App shell: layout, routing, lazy pages, hydration.

import React, { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RouterProvider, useRouter } from './router';
import { I18nProvider, useT } from './i18n';
import { usePrefs } from './store/prefs';
import { useLibrary } from './store/library';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { PlayerBar } from './components/player/PlayerBar';
import { ExpandedPlayer } from './components/player/ExpandedPlayer';
import { CommandPalette } from './components/CommandPalette';
import { TrackMenuHost } from './components/trackMenu';
import { Toasts } from './components/ui';
import { HomePage } from './pages/Home';
import { LibraryPage } from './pages/Library';

const Explore = lazy(() => import('./pages/Explore').then((m) => ({ default: m.ExplorePage })));
const Search = lazy(() => import('./pages/Explore').then((m) => ({ default: m.SearchPage })));
const Playlist = lazy(() => import('./pages/Browse').then((m) => ({ default: m.PlaylistPage })));
const Album = lazy(() => import('./pages/Browse').then((m) => ({ default: m.AlbumPage })));
const Artist = lazy(() => import('./pages/Browse').then((m) => ({ default: m.ArtistPage })));
const Favorites = lazy(() => import('./pages/Browse').then((m) => ({ default: m.FavoritesPage })));
const Downloads = lazy(() => import('./pages/Browse').then((m) => ({ default: m.DownloadsPage })));
const GetSonora = lazy(() => import('./pages/Brand').then((m) => ({ default: m.GetSonoraPage })));
const EarlyAccess = lazy(() => import('./pages/Brand').then((m) => ({ default: m.EarlyAccessPage })));
const Reven = lazy(() => import('./pages/Brand').then((m) => ({ default: m.RevenPage })));
const Stats = lazy(() => import('./pages/Brand').then((m) => ({ default: m.StatsPage })));
const Settings = lazy(() => import('./pages/Brand').then((m) => ({ default: m.SettingsPage })));
const Onboarding = lazy(() => import('./pages/Brand').then((m) => ({ default: m.Onboarding })));

function Loading() {
  return (
    <div className="p-10 space-y-4">
      <div className="h-8 w-48 rounded-lg bg-raised animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square rounded-xl bg-raised animate-pulse" />)}
      </div>
    </div>
  );
}

function Routes() {
  const { route } = useRouter();
  const p = route.path;

  let page: React.ReactNode;
  if (p === '/' || p === '/home') page = <HomePage />;
  else if (p === '/explore') page = <Explore />;
  else if (p === '/search') page = <Search />;
  else if (p === '/library') page = <LibraryPage />;
  else if (p.startsWith('/playlist/')) page = <Playlist id={p.split('/playlist/')[1]} />;
  else if (p.startsWith('/album/')) page = <Album albumKey={p.slice('/album/'.length)} />;
  else if (p.startsWith('/artist/')) page = <Artist name={p.slice('/artist/'.length)} />;
  else if (p === '/favorites') page = <Favorites />;
  else if (p === '/downloads') page = <Downloads />;
  else if (p === '/get') page = <GetSonora />;
  else if (p === '/early-access') page = <EarlyAccess />;
  else if (p === '/reven') page = <Reven />;
  else if (p === '/stats') page = <Stats />;
  else if (p === '/settings') page = <Settings />;
  else page = <HomePage />;

  return (
    <Suspense fallback={<Loading />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={p + (route.params.q ?? '')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex-1 overflow-y-auto"
        >
          {page}
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}

function Shell() {
  const prefs = usePrefs();
  const lib = useLibrary();
  const onboarded = prefs.onboarded;

  useEffect(() => { lib.hydrate(); }, []);

  // Global keyboard shortcuts (never while typing in inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        import('./store/ui').then((m) => m.useUi.getState().setPalette(true));
        return;
      }
      if (typing) return;
      if (e.key === ' ') {
        e.preventDefault();
        import('./store/player').then((m) => m.usePlayer.getState().toggle());
      } else if (e.key === 'ArrowRight' && e.shiftKey) {
        import('./store/player').then((m) => m.usePlayer.getState().next());
      } else if (e.key === 'ArrowLeft' && e.shiftKey) {
        import('./store/player').then((m) => m.usePlayer.getState().prev());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {!onboarded && (
        <Suspense fallback={null}><Onboarding onDone={() => {}} /></Suspense>
      )}
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col surface-panel border-l border-edge md:rounded-l-2xl my-0 md:my-2 md:mr-2 overflow-hidden">
          <Header />
          <Routes />
          <MobileNav />
        </main>
      </div>
      <PlayerBar />
      <ExpandedPlayer />
      <CommandPalette />
      <TrackMenuHost />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </I18nProvider>
  );
}
