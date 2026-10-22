// Small colour toolkit: builds a full accent ramp from one hex so the whole UI re-themes.
export const hexToRgb = (hex) => { const h = hex.replace('#', ''); const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h; const n = parseInt(f, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const isHex = (s) => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
export function hslToRgb([h, s, l]) {
  const f = (n) => { const k = (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
export const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
export function luminance([r, g, b]) { const c = [r, g, b].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
export const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

/** Builds ramp 50-900 where the chosen colour is the 600 anchor. */
export function buildRamp(hex) {
  const base = hexToRgb(hex), [h, s, l] = rgbToHsl(base);
  const L = { 50: .965, 100: .93, 200: .86, 300: .76, 400: .65, 500: Math.min(.7, l + .07), 600: l, 700: Math.max(.12, l - .08), 800: Math.max(.1, l - .16), 900: Math.max(.08, l - .25) };
  const ramp = {};
  for (const k of Object.keys(L)) {
    const lightEnd = +k < 600; const sat = lightEnd ? Math.min(1, s * (k <= 100 ? .75 : .9)) : s;
    ramp[k] = +k === 600 ? base : hslToRgb([h, sat, L[k]]);
  }
  return ramp;
}
