# SONORA — Your music. Your atmosphere.

Independent premium music experience created by **Reven** · **Early Access**

SONORA is a real, working web music app (React + TypeScript + Vite + PWA):

- 🎧 Persistent audio player: queue, shuffle, repeat, seek, volume, expanded view with ambient cover colors and live visualizer.
- 📁 Local library: import MP3/WAV/OGG files you own — ID3v2 tags and embedded covers are parsed; audio is stored in **IndexedDB on your device** (never uploaded).
- 🌐 Online catalog source: **Jamendo** (Creative Commons independent artists, attribution always shown).
- 🗂 Playlists (create/edit/reorder/delete, custom covers), favorites, followed artists, albums & artists views.
- 🔎 Search across local library + Jamendo, plus Ctrl/Cmd+K command palette.
- ❤️ Real listening statistics computed from actual playback history.
- 📲 Installable **PWA** (manifest, icons, offline service worker) — install from the browser.
- 🌗 Dark & light themes designed specifically, EN/ES languages, keyboard accessible, mobile-responsive.
- 🧪 Clearly-marked demo data (4 original synthesized tracks) to try the player instantly.

> Desktop `.exe/.dmg/.deb` installers are **not published yet** — the Get SONORA page says so honestly. The PWA gives an installed-app experience today.

---

## 1. Requirements

- Node.js **18+** (20 recommended) and npm.

## 2. Run locally (development)

```bash
npm ci          # install exact dependencies
npm run dev     # http://localhost:5173
```

## 3. Production build

```bash
npm run build   # type-checks (tsc -b) and outputs static site to dist/
npm run preview # serve the production build locally at http://localhost:4173
```

The `dist/` folder is a fully static site (HTML/JS/CSS + service worker + manifest). It can be served by any static host.

## 4. Deploy: GitHub → Vercel (recommended)

The repository root contains everything Vercel needs:

- `vercel.json` — framework `vite`, build command `npm run build`, output `dist`, SPA rewrites, correct cache headers (`sw.js` / `manifest.webmanifest` are never stale-cached; hashed assets are immutable).
- `package-lock.json` — Vercel installs with `npm ci` for reproducible builds.

Steps:

1. Push this project to a **GitHub** repository.
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** your GitHub repo.
3. Vercel auto-detects **Vite**; keep defaults (build command and output come from `vercel.json`). No environment variables are required.
4. Click **Deploy**. Every push to `main` redeploys automatically; pull requests get preview URLs.

Why Vercel matters for SONORA: PWA installation requires **HTTPS**, which every Vercel deployment provides. After deploying, open the URL, visit **Get SONORA**, and Chrome/Edge/Safari will offer "Install app".

> Alternative hosts: any static host works (`npm run build` → upload `dist/`). For Netlify set publish dir `dist` + SPA redirect `/* /index.html 200`. For GitHub Pages the app already uses relative paths (`base: './'`) and hash routing, so it works under sub-paths too.

## 5. Music sources — how to add a new one

SONORA uses a provider architecture: every source maps into the unified `Track` model (`src/types/music.ts`).

To add a new source (e.g., another API or a network drive):

1. Create `src/services/<provider>.ts` exporting functions that return `Track[]`:
   - map the provider response into `Track` (`id: '<provider>-<nativeId>'`, `source`, `sourceId`, `playUrl`, `coverUrl`, `durationSec`, license/attribution info);
   - provide a way to re-resolve expiring stream URLs (see `fetchJamendoFresh`).
2. Register `'provider'` as a `TrackSource` in `src/types/music.ts` and render its badge in `SourceBadge` (`src/components/ui.tsx`).
3. Wire it into pages: Explore shelves (`src/pages/Explore.tsx`), search results, and the command palette (`src/components/CommandPalette.tsx`).
4. If it streams remote audio, add a runtime caching rule for its domains in `vite.config.ts` (Workbox section), like the Jamendo ones.
5. Respect licensing/attribution requirements — the UI must always show where streamed music comes from.

Jamendo config (client_id, enable/disable) lives in **Settings → Sources**. The default client id is Jamendo's public test id; register your own for production traffic.

## 6. Project structure

```
src/
  audio/engine.ts        HTMLAudioElement wrapper (outside React — survives navigation)
  store/                 zustand stores: player, library, prefs, ui
  services/              db (IndexedDB/localStorage), metadata (ID3 parser), jamendo, demo, artwork
  components/            layout (Sidebar/Header/MobileNav), player, browse cards, design system (ui.tsx)
  pages/                 Home, Library, Explore/Search, Browse (playlist/album/artist/favorites/downloads), Brand (Get/EarlyAccess/Reven/Stats/Settings/Onboarding)
  i18n/                  EN/ES typed dictionary
public/icons/            PWA icons (generated, SONORA brand)
vercel.json              Vercel deploy config
vite.config.ts           Vite + VitePWA (manifest + Workbox strategies)
```

## 7. Notes & current limitations (Early Access)

- Persisted state (library index, playlists, favorites, history) lives in `localStorage`; audio blobs in IndexedDB. Clearing site data deletes them — use **Settings → Export backup**.
- Imported-file audio only plays in the browser/device where it was imported (by design: no uploads).
- Jamendo stream links rotate; the player re-resolves them automatically and explains failures honestly.
- Stats reflect real measured listening (≥5 s per play), nothing invented.

## 8. Credits

Created by **Reven** · Streaming catalog courtesy of **Jamendo** (Creative Commons artists) · Demo tracks are original audio synthesized inside the app for testing.

**SONORA — La música, a tu manera.** Early Access v0.1.0
