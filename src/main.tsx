// SONORA — entry point. Registers the service worker via virtual module (vite-plugin-pwa).

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// PWA: register SW with an honest update prompt (registerType: 'prompt').
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      const updateSW = registerSW({
        onNeedRefresh() {
          // Ask before reloading so playback isn't interrupted silently.
          const ok = window.confirm('SONORA has a new version available. Reload to update?');
          if (ok) updateSW(true);
        },
        onOfflineReady() {
          console.info('SONORA: offline-ready.');
        },
      });
    } catch {
      /* SW registration is best-effort */
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
