// SONORA — contextual header: nav history, search access, install button, profile, early badge.

import React from 'react';
import { ChevronLeft, ChevronRight, Search, Download, UserRound } from 'lucide-react';
import { useRouter } from '../../router';
import { useUi } from '../../store/ui';
import { usePrefs } from '../../store/prefs';
import { useT } from '../../i18n';
import { EarlyBadge } from '../ui';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export function Header() {
  const { t } = useT();
  const setPalette = useUi((s) => s.setPalette);
  const username = usePrefs((s) => s.username);
  const { navigate } = useRouter();
  const { detail, install, canPrompt } = usePwaInstall();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6 h-14 surface-panel/80 backdrop-blur-md border-b border-edge/50">
      <div className="hidden md:flex items-center gap-1">
        <button aria-label="Back" onClick={() => history.back()} className="p-1.5 rounded-full text-mute hover:text-ink hover:bg-white/5"><ChevronLeft size={19} /></button>
        <button aria-label="Forward" onClick={() => history.forward()} className="p-1.5 rounded-full text-mute hover:text-ink hover:bg-white/5"><ChevronRight size={19} /></button>
      </div>
      <button
        onClick={() => setPalette(true)}
        className="flex-1 max-w-md flex items-center gap-2 rounded-full surface-raised border px-3.5 py-2 text-sm text-mute hover:border-lime/40 transition-colors"
        aria-label={t('search_placeholder')}
      >
        <Search size={15} />
        <span className="truncate">{t('search_placeholder')}</span>
        <kbd className="ml-auto hidden sm:inline text-[10px] border border-edge rounded px-1.5 py-0.5 text-mute/70 font-sans">Ctrl K</kbd>
      </button>
      <div className="flex items-center gap-2 ml-auto">
        <EarlyBadge className="hidden lg:inline-flex" />
        {detail.kind !== 'installed' && canPrompt && (
          <button
            onClick={() => install()}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-full surface-raised border px-3 py-1.5 hover:border-lime/50 hover:text-lime transition-colors"
            title={t('install')}
          >
            <Download size={13} /><span className="hidden sm:inline">{t('install')}</span>
          </button>
        )}
        {detail.kind === 'installed' && (
          <span className="text-xs text-lime font-semibold hidden sm:inline" title={t('installed')}>✓ PWA</span>
        )}
        <button onClick={() => navigate('/settings')} aria-label="Profile"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-lime/70 to-electric/60 grid place-items-center text-black font-bold text-xs shrink-0"
          title={username || t('username')}>
          {(username || 'S')[0].toUpperCase()}
        </button>
      </div>
    </header>
  );
}
