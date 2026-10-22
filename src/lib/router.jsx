import { useEffect, useState, useCallback } from 'react';

const parse = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path || '/', segments: path.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(qs)) };
};

export function navigate(to, { replace = false } = {}) {
  const url = '#' + to;
  if (replace) window.history.replaceState(null, '', url); else window.location.hash = to;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => { const f = () => setR(parse()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return r;
}

export function Link({ to, children, className, onClick, ...rest }) {
  const go = useCallback((e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault(); onClick?.(e); navigate(to);
  }, [to, onClick]);
  return <a href={'#' + to} onClick={go} className={className} {...rest}>{children}</a>;
}
