import React from 'react';
import { Home, Compass, Search, Library, ListMusic } from 'lucide-react';
import { Link, useRouter } from '../../router';
import { useT } from '../../i18n';

const items = [
  { to: '/', icon: Home, key: 'nav_home' as const },
  { to: '/explore', icon: Compass, key: 'nav_explore' as const },
  { to: '/search', icon: Search, key: 'nav_search' as const },
  { to: '/library', icon: Library, key: 'nav_library' as const },
  { to: '/playlists', icon: ListMusic, key: 'nav_playlists' as const },
];

export function MobileNav() {
  const { t } = useT();
  const { route } = useRouter();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 surface-panel border-t flex justify-around pb-[env(safe-area-inset-bottom)]" aria-label="Main" style={{ height: 64 }}>
      {items.map(({ to, icon: Icon, key }) => {
        const active = route.path === to;
        return (
          <Link key={to} to={to} className="flex flex-col items-center justify-center gap-1 w-16 text-[10px] font-semibold" aria-label={t(key)}>
            <Icon size={20} className={active ? 'text-lime' : 'text-mute'} />
            <span className={active ? 'text-lime' : 'text-mute'}>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
