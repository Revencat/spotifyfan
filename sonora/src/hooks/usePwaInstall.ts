// SONORA — honest PWA install flow.
// Uses the real beforeinstallprompt event when available; otherwise explains why.

import { useEffect, useState } from 'react';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState =
  | { kind: 'available' }
  | { kind: 'installed' }
  | { kind: 'unsupported'; reason: string };

export function usePwaInstall() {
  const [state, setState] = useState<InstallState>(() => detect());
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
      setState({ kind: 'available' });
    };
    const onInstalled = () => { setState({ kind: 'installed' }); setBip(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!bip) return 'unavailable';
    setInstalling(true);
    try {
      await bip.prompt();
      const choice = await bip.userChoice;
      setBip(null);
      if (choice.outcome === 'accepted') setState({ kind: 'installed' });
      return choice.outcome;
    } catch {
      return 'unavailable';
    } finally {
      setInstalling(false);
    }
  };

  return { state, install, installing, canPrompt: !!bip };
}

function detect(): InstallState {
  if (isStandalone()) return { kind: 'installed' };
  const secure = window.isSecureContext || location.hostname === 'localhost';
  if (!secure) return { kind: 'unsupported', reason: 'Installation requires a secure origin (HTTPS or localhost).' };
  return { kind: 'unsupported', reason: 'Your browser has not offered installation yet. Look for an install icon in the address bar, or use your browser menu → "Install app".' };
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}

export function platformHint(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'On iOS Safari: Share → Add to Home Screen.';
  if (/Mac/.test(ua)) return 'In Chrome on macOS: click the install icon in the address bar, or browser menu → Install page as app.';
  if (/Windows/.test(ua)) return 'In Chrome/Edge on Windows: click the install icon in the address bar, or browser menu (⋯) → Apps → Install this site as an app.';
  if (/Android/.test(ua)) return 'In Chrome on Android: menu (⋮) → Add to Home screen / Install app.';
  return 'Use your browser menu → "Install app" / "Add to Home screen".';
}
