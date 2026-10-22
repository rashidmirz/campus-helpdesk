import { useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const css = (v) => `var(${v})`;
export const CAT = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];

export function Sparkline({ data, width = 96, height = 28, color = 'rgb(var(--ac))', area = true }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * width, height - 3 - (v - min) / rng * (height - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {area && <path d={`${d} L${width} ${height} L0 ${height}Z`} fill={color} opacity=".12" />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="2.6" fill={color} stroke="rgb(var(--surface))" strokeWidth="1.5" />
    </svg>
  );
}

/** Multi-series line chart with crosshair + tooltip. series: [{name, color, data[], area?, dash?}] */
export function LineChart({ series, labels, height = 240, format = (v) => v, yTicks = 4, domain }) {
  const ref = useRef(); const [w, setW] = useState(640); const [hover, setHover] = useState(null);
  const ro = useRef();
  const setRef = (el) => { ref.current = el; ro.current?.disconnect(); if (el) { ro.current = new ResizeObserver(() => setW(el.clientWidth || 640)); ro.current.observe(el); setW(el.clientWidth || 640); } };
  const m = { t: 12, r: 12, b: 26, l: 34 }, iw = Math.max(100, w - m.l - m.r), ih = height - m.t - m.b;
  const all = series.flatMap(s => s.data); const rawMax = Math.max(...all, 1);
  const step = Math.pow(10, Math.floor(Math.log10(rawMax / yTicks))); const nice = [1, 2, 2.5, 5, 10].map(f => f * step).find(s => s * yTicks >= rawMax) || step * 10;
  const [lo, hi] = domain || [0, nice * yTicks], n = labels.length;
  const x = (i) => m.l + i / (n - 1) * iw, y = (v) => m.t + ih - (v - lo) / (hi - lo) * ih;
  const path = (d) => d.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const onMove = (e) => { const r = ref.current.getBoundingClientRect(); const i = Math.round((e.clientX - r.left - m.l) / iw * (n - 1)); setHover(Math.max(0, Math.min(n - 1, i))); };
  const every = Math.ceil(n / Math.max(2, Math.floor(iw / 70)));
  return (
    <div ref={setRef} className="relative w-full select-none">
      <svg width={w} height={height} role="img" aria-label={`Line chart: ${series.map(s => s.name).join(', ')}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchMove={(e) => onMove(e.touches[0])}>
        {Array.from({ length: yTicks + 1 }, (_, i) => lo + (hi - lo) * i / yTicks).map((t, ti) => (
          <g key={t}><line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeWidth="1" strokeDasharray={ti ? '2 4' : '0'} /><text x={m.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--ink-3))" className="num">{format(t)}</text></g>
        ))}
        {labels.map((l, i) => i % every === 0 && <text key={i} x={x(i)} y={height - 7} textAnchor="middle" fontSize="11" fill="rgb(var(--ink-3))">{l}</text>)}
        {series.map((s, si) => (
          <g key={s.name}>
            {s.area && <path d={`${path(s.data)} L${x(n - 1)} ${y(lo)} L${x(0)} ${y(lo)}Z`} fill={s.color} opacity=".1" />}
            <path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />
            {hover != null && <circle cx={x(hover)} cy={y(s.data[hover])} r="4.5" fill={s.color} stroke="rgb(var(--surface))" strokeWidth="2" />}
          </g>
        ))}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="rgb(var(--ink-3))" strokeWidth="1" strokeDasharray="3 3" />}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute z-10 rounded-lg bg-ink px-3 py-2 text-xs text-surface shadow-pop" style={{ left: Math.min(w - 150, Math.max(0, x(hover) + 12)), top: 8 }}>
          <div className="mb-1 font-medium opacity-70">{labels[hover]}</div>
          {series.map(s => <div key={s.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: s.color }} /><span className="opacity-80">{s.name}</span><span className="num ml-auto pl-3 font-semibold">{format(s.data[hover])}</span></div>)}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-4 pl-[34px] text-xs text-ink-2">{series.map(s => <span key={s.name} className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: s.color }} />{s.name}</span>)}</div>
    </div>
  );
}

/** Horizontal bars. items: [{label, value, color?, note?}] */
export function HBars({ items, max, format = (v) => v, color = 'rgb(var(--ac))' }) {
  const mx = max ?? Math.max(...items.map(i => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map(i => (
        <li key={i.label} className="group grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 text-sm" title={`${i.label}: ${format(i.value)}`}>
          <span className="truncate text-ink-2">{i.label}</span>
          <span className="h-2.5 rounded-full bg-surface-3 overflow-hidden"><span className="block h-full rounded-r-full transition-all group-hover:brightness-110" style={{ width: `${i.value / mx * 100}%`, background: i.color || color }} /></span>
          <span className="num w-12 text-right font-medium text-ink">{format(i.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Donut({ parts, size = 168, thickness = 22, center }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1, r = (size - thickness) / 2, c = 2 * Math.PI * r;
  const [hi, setHi] = useState(null); let off = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Donut chart" className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--surface-3))" strokeWidth={thickness} />
          {parts.map((p, i) => { const len = p.value / total * c, gap = parts.length > 1 ? 2 : 0; const el = (
            <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={hi === i ? thickness + 4 : thickness} strokeDasharray={`${Math.max(0, len - gap)} ${c}`} strokeDashoffset={-off} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} className="transition-all" />); off += len; return el; })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="num font-display text-2xl text-ink">{hi != null ? parts[hi].value : center?.value}</span>
          <span className="max-w-[90px] text-xs text-ink-2">{hi != null ? parts[hi].label : center?.label}</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">{parts.map((p, i) => <li key={p.label} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /><span className="text-ink-2">{p.label}</span><span className="num ml-auto pl-4 font-medium text-ink">{p.value}</span></li>)}</ul>
    </div>
  );
}

/** Sequential heatmap in the accent hue (lightness = magnitude). */
export function Heatmap({ rows, cols, data, unit = 'requests' }) {
  const max = Math.max(...data.flat(), 1); const [tip, setTip] = useState(null);
  return (
    <div className="relative">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `2.2rem repeat(${cols.length}, minmax(0,1fr))` }}>
        <span />{cols.map((c, i) => <span key={i} className="text-center text-[10px] text-ink-3">{i % 2 === 0 ? c : ''}</span>)}
        {rows.map((r, ri) => [<span key={r} className="flex items-center text-xs text-ink-3">{r}</span>, ...data[ri].map((v, ci) => (
          <span key={`${ri}-${ci}`} onMouseEnter={() => setTip({ r, c: cols[ci], v })} onMouseLeave={() => setTip(null)}
            className="aspect-[1.4] rounded-[3px]" style={{ background: v ? `rgb(var(--ac) / ${0.12 + 0.88 * v / max})` : 'rgb(var(--surface-3))' }} />))])}
      </div>
      <p className="mt-3 h-4 text-xs text-ink-2 num">{tip ? <><b className="text-ink">{tip.v}</b> {unit} · {tip.r} at {tip.c}</> : 'Hover a cell for details'}</p>
    </div>
  );
}
