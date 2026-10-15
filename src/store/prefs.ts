// SONORA preferences — username, theme, onboarding.

import { create } from 'zustand';
import { lsGet, lsSet } from '../services/db';

interface PrefsState {
  username: string;
  theme: 'dark' | 'light';
  onboarded: boolean;
  sidebarCollapsed: boolean;
  setName: (n: string) => void;
  setTheme: (t: 'dark' | 'light') => void;
  finishOnboarding: () => void;
  toggleSidebar: () => void;
}

function applyTheme(t: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', t === 'dark');
}

export const usePrefs = create<PrefsState>((set, get) => ({
  username: lsGet('username', ''),
  theme: lsGet('theme', 'dark' as const),
  onboarded: lsGet('onboarded', false),
  sidebarCollapsed: lsGet('sidebar', false),
  setName: (n) => { lsSet('username', n); set({ username: n }); },
  setTheme: (t) => { lsSet('theme', t); applyTheme(t); set({ theme: t }); },
  finishOnboarding: () => { lsSet('onboarded', true); set({ onboarded: true }); },
  toggleSidebar: () => { const v = !get().sidebarCollapsed; lsSet('sidebar', v); set({ sidebarCollapsed: v }); },
}));

applyTheme(lsGet('theme', 'dark' as const));
