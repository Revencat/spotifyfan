// SONORA — stable desktop sidebar, collapsible; creator zone at bottom.

import React from 'react';
import { Home, Compass, Search, Library, Disc3, Users, ListMusic, Heart, Download, Settings, PanelLeftClose, PanelLeftOpen, BarChart3, MonitorDown } from 'lucide-react';
import { Link, useRouter } from '../../router';
import { usePrefs } from '../../store/prefs';
import { useT } from '../../i18n';
import { Logo, EarlyBadge } from '../ui';

const items = [
  { to: '/', icon: Home, key: 'nav_home' as const },
  { to: '/explore', icon: Compass, key: 'nav_explore' as const },
  { to: '/search', icon: Search, key: 'nav_search' as const },
  { to: '/library', icon: Library, key: 'nav_library' as const },
  { to: '/albums', icon: Disc3, key: 'nav_albums' as const },
  { to: '/artists', icon: Users, key: 'nav_artists' as const },
  { to: '/playlists', icon: ListMusic, key: 'nav_playlists' as const },
  { to: '/favorites', icon: Heart, key: 'nav_favorites' as const },
  { to: '/downloads', icon: Download, key: 'nav_downloads' as const },
  { to: '/stats', icon: BarChart3, key: 'nav_stats' as const },
];

export function Sidebar() {
  const { t } = useT();
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const toggle = usePrefs((s) => s.toggleSidebar);
  const { route } = useRouter();

  return (
    <aside className={`hidden md:flex flex-col surface-panel border-r transition-[width] duration-300 sticky top-0 h-full shrink-0 ${collapsed ? 'w-[76px]' : 'w-[232px]'}`}>
      <div className={`flex items-center h-14 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
        <Link to="/" aria-label="SONORA home"><Logo small={collapsed} /></Link>
        {!collapsed && (
          <button onClick={toggle} aria-label="Collapse sidebar" className="text-mute hover:text-ink p-1.5 rounded-lg"><PanelLeftClose size={17} /></button>
        )}
      </div>
      {collapsed && (
        <button onClick={toggle} aria-label="Expand sidebar" className="text-mute hover:text-ink p-2 mx-auto mb-1 rounded-lg"><PanelLeftOpen size={17} /></button>
      )}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-0.5 px-2" aria-label="Main">
        {items.map(({ to, icon: Icon, key }) => {
          const active = route.path === to;
          return (
            <Link key={to} to={to} title={t(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group ${collapsed ? 'justify-center px-0' : ''} ${active ? 'bg-raised text-ink' : 'text-mute hover:text-ink hover:bg-white/5'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-lime" aria-hidden />}
              <Icon size={19} className={active ? 'text-lime' : ''} />
              {!collapsed && <span>{t(key)}</span>}
            </Link>
          );
        })}
        <div className="pt-2 mt-2 border-t border-edge/60 space-y-0.5">
          <Link to="/get" title={t('get_sonora')}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center px-0' : ''} ${route.path === '/get' ? 'bg-raised text-ink' : 'text-mute hover:text-ink hover:bg-white/5'}`}>
            <MonitorDown size={19} className={route.path === '/get' ? 'text-lime' : ''} />
            {!collapsed && <span>{t('get_sonora')}</span>}
          </Link>
          <Link to="/settings" title={t('nav_settings')}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center px-0' : ''} ${route.path === '/settings' ? 'bg-raised text-ink' : 'text-mute hover:text-ink hover:bg-white/5'}`}>
            <Settings size={19} className={route.path === '/settings' ? 'text-lime' : ''} />
            {!collapsed && <span>{t('nav_settings')}</span>}
          </Link>
        </div>
      </nav>

      {/* Creator + early access zone */}
      <div className={`p-3 border-t border-edge/60 ${collapsed ? 'flex justify-center' : ''}`}>
        <Link to="/reven" className={`flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors w-full ${collapsed ? 'justify-center w-auto' : ''}`}>
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-lime/70 to-electric/60 grid place-items-center font-black text-black text-sm shrink-0" aria-hidden>R</span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-tight">SONORA</span>
              <span className="block text-[11px] text-mute truncate">{t('created_by')} {t('reven')}</span>
              <EarlyBadge className="mt-1" />
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
