import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { buildRamp, hexToRgb, mix, contrast, rgbToHex, luminance, rgbToHsl, hslToRgb } from './color';
import { safeStorage } from './utils';

export const ACCENTS = [
  { id: 'maroon', name: 'Maroon', hex: '#8A1C2B' },
  { id: 'cobalt', name: 'Cobalt', hex: '#2F4BDB' },
  { id: 'oak', name: 'Oak', hex: '#1F7A5C' },
  { id: 'crimson', name: 'Crimson', hex: '#C81E2E' },
  { id: 'violet', name: 'Violet', hex: '#6D4AE0' },
  { id: 'teal', name: 'Lagoon', hex: '#0B7C7C' },
  { id: 'rose', name: 'Rose', hex: '#CC2F6A' },
  { id: 'saffron', name: 'Saffron', hex: '#F2A100' },
  { id: 'graphite', name: 'Graphite', hex: '#2B3240' },
];
export const FONTS = [
  { id: 'studio', name: 'Studio', note: 'Bricolage Grotesque + Instrument Sans' },
  { id: 'neutral', name: 'Neutral', note: 'Inter Tight + Inter' },
  { id: 'classic', name: 'Classic', note: 'Source Serif + Source Sans' },
  { id: 'technical', name: 'Technical', note: 'IBM Plex Sans' },
  { id: 'friendly', name: 'Friendly', note: 'Plus Jakarta Sans' },
  { id: 'system', name: 'System', note: 'Your device font' },
];
export const PRESETS = [
  { id: 'default', name: 'Silver Oak Maroon', desc: 'Maroon page, white panels, dark maroon type', s: { accent: 'maroon', canvas: 'brand', font: 'studio', radius: 'soft', density: 'comfortable', sidebar: 'accent' } },
  { id: 'classic', name: 'Cobalt Light', desc: 'Light page, cobalt accent, dark rail', s: { accent: 'cobalt', canvas: 'light', font: 'studio', radius: 'soft', density: 'comfortable', sidebar: 'dark' } },
  { id: 'paper', name: 'Paper', desc: 'Serif headings, light rail', s: { accent: 'oak', canvas: 'light', font: 'classic', radius: 'sharp', density: 'comfortable', sidebar: 'light' } },
  { id: 'ops', name: 'Control room', desc: 'Compact, technical, graphite', s: { accent: 'graphite', canvas: 'light', font: 'technical', radius: 'sharp', density: 'compact', sidebar: 'dark' } },
  { id: 'campus', name: 'Campus', desc: 'Friendly, round, violet canvas', s: { accent: 'violet', canvas: 'brand', font: 'friendly', radius: 'round', density: 'spacious', sidebar: 'accent' } },
];

export const DEFAULTS = { mode: 'light', accent: 'maroon', custom: '#8A1C2B', canvas: 'brand', font: 'studio', radius: 'soft', density: 'comfortable', sidebar: 'accent', scale: 1, motion: 'full' };
const KEY = 'sou.theme.v3';
const CANVAS_VARS = ['--app', '--ink', '--ink-2', '--ink-3', '--line', '--line-strong'];
const Ctx = createContext(null);

const triplet = (rgb) => rgb.map(v => Math.round(v)).join(' ');

export function applyTheme(s, resolvedMode) {
  const root = document.documentElement;
  const hex = s.accent === 'custom' ? s.custom : (ACCENTS.find(a => a.id === s.accent)?.hex || DEFAULTS.custom);
  const ramp = buildRamp(hex), dark = resolvedMode === 'dark';
  Object.entries(ramp).forEach(([k, v]) => root.style.setProperty(`--ac-${k}`, triplet(v)));
  const solid = dark ? (luminance(ramp[600]) < 0.06 ? ramp[400] : ramp[500]) : ramp[600];
  const surface = dark ? [19, 22, 29] : [255, 255, 255];
  root.style.setProperty('--ac', triplet(solid));
  root.style.setProperty('--ac-hover', triplet(dark ? ramp[400] : ramp[700]));
  root.style.setProperty('--ac-soft', triplet(dark ? mix(surface, ramp[500], .17) : ramp[50]));
  root.style.setProperty('--ac-soft-fg', triplet(dark ? ramp[300] : ramp[700]));
  root.style.setProperty('--ac-on', triplet(contrast(solid, [255, 255, 255]) >= 4.2 ? [255, 255, 255] : [20, 24, 34]));
  const brand = s.canvas === 'brand' && !dark;
  const set = (k, v) => root.style.setProperty(k, triplet(v));
  if (brand) {
    const [h, sat] = rgbToHsl(ramp[600]); const tint = (sl, l) => hslToRgb([h, Math.min(sat, sl), l]);
    // panel tokens (white cards): dark brand-tinted type
    set('--p-ink', tint(.55, .14)); set('--p-ink-2', tint(.3, .31)); set('--p-ink-3', tint(.2, .42));
    set('--p-line', tint(.25, .915)); set('--p-line-strong', tint(.22, .8)); set('--p-surface-2', tint(.3, .975)); set('--p-surface-3', tint(.28, .948));
    set('--p-ac', solid); set('--p-ac-hover', ramp[700]); set('--p-ac-soft', ramp[50]); set('--p-ac-soft-fg', ramp[700]);
    set('--p-ac-on', contrast(solid, [255, 255, 255]) >= 4.2 ? [255, 255, 255] : [20, 24, 34]);
    // canvas tokens (text sitting straight on the brand colour)
    set('--app', ramp[700]); set('--ink', [255, 255, 255]); set('--ink-2', ramp[100]); set('--ink-3', ramp[200]);
    set('--line', ramp[600]); set('--line-strong', ramp[500]);
    set('--ac', [255, 255, 255]); set('--ac-hover', ramp[100]); set('--ac-on', ramp[800]); set('--ac-soft', ramp[800]); set('--ac-soft-fg', [255, 255, 255]);
    root.setAttribute('data-canvas', 'brand');
  } else {
    CANVAS_VARS.forEach(k => root.style.removeProperty(k)); root.setAttribute('data-canvas', 'plain');
  }
  root.setAttribute('data-mode', resolvedMode);
  root.setAttribute('data-font', s.font); root.setAttribute('data-radius', s.radius);
  root.setAttribute('data-density', s.density); root.setAttribute('data-sidebar', s.sidebar);
  root.setAttribute('data-motion', s.motion);
  root.style.setProperty('--scale', s.scale);
  return rgbToHex(solid);
}

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...DEFAULTS, ...safeStorage.get(KEY, {}) }));
  const [sysDark, setSysDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  useEffect(() => { const mq = window.matchMedia?.('(prefers-color-scheme: dark)'); if (!mq) return; const f = (e) => setSysDark(e.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, []);
  const resolved = settings.mode === 'system' ? (sysDark ? 'dark' : 'light') : settings.mode;
  useEffect(() => { applyTheme(settings, resolved); safeStorage.set(KEY, settings); }, [settings, resolved]);

  const update = useCallback((patch) => setSettings(s => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings({ ...DEFAULTS }), []);
  const applyPreset = useCallback((p) => setSettings(s => ({ ...s, ...p.s })), []);
  const toggleMode = useCallback(() => setSettings(s => ({ ...s, mode: (s.mode === 'system' ? (sysDark ? 'dark' : 'light') : s.mode) === 'dark' ? 'light' : 'dark' })), [sysDark]);
  const value = useMemo(() => ({ settings, resolved, update, reset, applyPreset, toggleMode }), [settings, resolved, update, reset, applyPreset, toggleMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
