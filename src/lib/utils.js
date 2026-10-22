import clsx from 'clsx';
export const cn = (...a) => clsx(...a);

export const HOUR = 3600e3, DAY = 24 * HOUR;

export function timeAgo(ts, now = Date.now()) {
  const d = now - ts;
  if (d < 60e3) return 'just now';
  if (d < HOUR) return `${Math.floor(d / 60e3)}m ago`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h ago`;
  if (d < 7 * DAY) return `${Math.floor(d / DAY)}d ago`;
  return fmtDate(ts);
}
export const fmtDate = (ts, o = { day: 'numeric', month: 'short' }) => new Date(ts).toLocaleDateString('en-IN', o);
export const fmtDateTime = (ts) => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
export const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

/** "3h 20m" style duration; negative -> overdue */
export function duration(ms) {
  const a = Math.abs(ms), d = Math.floor(a / DAY), h = Math.floor((a % DAY) / HOUR), m = Math.floor((a % HOUR) / 60e3);
  if (d >= 1) return `${d}d ${h}h`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

export const initials = (name = '') => name.replace(/^(Dr\.|Prof\.)\s*/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export function hash(str = '') { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }

export function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}`;
export const pluralize = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export function download(filename, text, type = 'text/plain') {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch (e) { /* download blocked in sandboxed previews */ }
}

export const safeStorage = {
  get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* noop */ } },
};
