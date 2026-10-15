// SONORA — minimal hash router (no external dep, PWA-friendly).

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Route { path: string; params: Record<string, string> }

interface RouterCtx { route: Route; navigate: (to: string) => void }
const Ctx = createContext<RouterCtx>({ route: { path: '/', params: {} }, navigate: () => {} });

function parseHash(): Route {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || '/';
  const [path, query] = splitQ(raw);
  const params: Record<string, string> = {};
  if (query) new URLSearchParams(query).forEach((v, k) => (params[k] = v));
  return { path: path.startsWith('/') ? path : '/' + path, params };
}

function splitQ(s: string): [string, string?] {
  const i = s.indexOf('?');
  return i < 0 ? [s] : [s.slice(0, i), s.slice(i + 1)];
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const on = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const navigate = (to: string) => { location.hash = '#' + to; };
  return <Ctx.Provider value={{ route, navigate }}>{children}</Ctx.Provider>;
}

export const useRouter = () => useContext(Ctx);

export function Link({ to, className, children, onClick, ...rest }: {
  to: string; className?: string; children: React.ReactNode; onClick?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const { navigate } = useRouter();
  return (
    <a
      href={'#' + to}
      className={className}
      onClick={(e) => { e.preventDefault(); navigate(to); onClick?.(); }}
      {...rest}
    >
      {children}
    </a>
  );
}
