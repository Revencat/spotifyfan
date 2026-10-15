// SONORA UI store — global toasts and command palette state.

import { create } from 'zustand';
import type { Toast } from '../types/music';

interface UiState {
  toasts: Toast[];
  paletteOpen: boolean;
  pushToast: (message: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  setPalette: (b: boolean) => void;
}

let tid = 1;

export const useUi = create<UiState>((set) => ({
  toasts: [],
  paletteOpen: false,
  pushToast: (message, kind = 'ok') => {
    const id = tid++;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setPalette: (b) => set({ paletteOpen: b }),
}));
