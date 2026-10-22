import { useEffect, useRef, useState, useId, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ChevronDown, Star, Inbox, Paperclip, UploadCloud, Clock, AlertTriangle, CheckCircle2, PauseCircle, FileText, Trash2 } from 'lucide-react';
import { cn, initials, hash, duration, timeAgo } from '../../lib/utils';
import { slaOf } from '../../lib/sla';
import { PRIORITIES } from '../../data/seed';
import { statusMeta } from '../../store/store';

/* ── Buttons ─────────────────────────────────────────────────────────── */
const BTN = {
  primary: 'bg-accent text-accent-on hover:bg-accent-hover shadow-sm',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-3',
  soft: 'bg-accent-soft text-accent-softfg hover:brightness-95',
  ghost: 'text-ink-2 hover:bg-ink/10 hover:text-ink',
  danger: 'bg-bad text-white hover:brightness-110',
  dark: 'bg-sb-bg text-sb-fg hover:opacity-90',
};
export function Button({ variant = 'primary', size = 'md', className, icon: Icon, iconRight: IconR, children, loading, ...p }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={cn('inline-flex items-center justify-center gap-2 font-medium rounded-md whitespace-nowrap transition disabled:opacity-50 disabled:pointer-events-none select-none',
      size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-6 text-[15px]' : 'ctl px-4 text-sm', BTN[variant], className)}>
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}{IconR && <IconR className="h-4 w-4 shrink-0" />}
    </button>
  );
}
export const IconButton = ({ label, className, children, active, ...p }) => (
  <button aria-label={label} title={label} {...p} className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-2 hover:bg-ink/10 hover:text-ink transition', active && 'bg-ink/10 text-ink', className)}>{children}</button>
);

/* ── Badges & pills ──────────────────────────────────────────────────── */
const TONES = { neutral: 'bg-surface-3 text-ink-2', ok: 'bg-ok-soft text-ok-fg', warn: 'bg-warn-soft text-warn-fg', bad: 'bg-bad-soft text-bad-fg', info: 'bg-info-soft text-info-fg', violet: 'bg-violet-soft text-violet-fg', accent: 'bg-accent-soft text-accent-softfg' };
const DOT = { neutral: 'bg-ink-3', ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', info: 'bg-info', violet: 'bg-violet', accent: 'bg-accent' };
export const Badge = ({ tone = 'neutral', dot, children, className }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', TONES[tone], className)}>
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT[tone])} />}{children}
  </span>
);
export const StatusPill = ({ status }) => { const m = statusMeta(status); return <Badge tone={m.tone} dot>{m.name}</Badge>; };
const PTONE = { low: 'neutral', medium: 'info', high: 'warn', urgent: 'bad' };
export const PriorityPill = ({ priority, compact }) => {
  const bars = { low: 1, medium: 2, high: 3, urgent: 4 }[priority];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 capitalize">
      <span className="flex items-end gap-[2px] h-3.5" aria-hidden>{[1, 2, 3, 4].map(i => <span key={i} style={{ height: 4 + i * 2.5 }} className={cn('w-[3px] rounded-[1px]', i <= bars ? (priority === 'urgent' ? 'bg-bad' : priority === 'high' ? 'bg-warn' : 'bg-accent') : 'bg-line-strong')} />)}</span>
      {!compact && PRIORITIES.find(p => p.id === priority)?.name}
    </span>
  );
};
export function SlaChip({ ticket, now, full }) {
  const s = slaOf(ticket, now);
  const cfg = {
    met: { tone: 'ok', Icon: CheckCircle2, text: 'Met SLA' },
    breached: { tone: 'bad', Icon: AlertTriangle, text: s.done ? 'Missed SLA' : `Overdue ${duration(s.remaining)}` },
    at_risk: { tone: 'warn', Icon: Clock, text: `${duration(s.remaining)} left` },
    on_track: { tone: 'neutral', Icon: Clock, text: `${duration(s.remaining)} left` },
    paused: { tone: 'neutral', Icon: PauseCircle, text: 'Clock paused' },
  }[s.state];
  return <Badge tone={cfg.tone} className="num"><cfg.Icon className="h-3 w-3" />{full && s.state !== 'met' && s.state !== 'paused' && !s.done ? '' : ''}{cfg.text}</Badge>;
}

/* ── Avatar ──────────────────────────────────────────────────────────── */
const HUES = [[250, 60], [160, 55], [20, 70], [300, 50], [200, 65], [340, 62], [45, 75], [120, 45]];
export function Avatar({ name = '', size = 32, className, ring }) {
  const [h, s] = HUES[hash(name) % HUES.length];
  return (
    <span aria-hidden title={name} style={{ width: size, height: size, fontSize: size * .38, background: `linear-gradient(140deg, hsl(${h} ${s}% 52%), hsl(${(h + 30) % 360} ${s}% 38%))` }}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none', ring && 'ring-2 ring-surface', className)}>{initials(name)}</span>
  );
}
export const AvatarStack = ({ names, size = 24, max = 4 }) => (
  <span className="flex -space-x-1.5">{names.slice(0, max).map((n, i) => <Avatar key={i} name={n} size={size} ring />)}{names.length > max && <span style={{ width: size, height: size }} className="inline-flex items-center justify-center rounded-full bg-surface-3 text-[10px] font-medium text-ink-2 ring-2 ring-surface">+{names.length - max}</span>}</span>
);

/* ── Layout helpers ──────────────────────────────────────────────────── */
export const Card = ({ className, pad = true, children, ...p }) => <div {...p} className={cn('card', pad && 'card-pad', className)}>{children}</div>;
export function PageHeader({ title, subtitle, actions, back, children }) {
  return (
    <div className="mb-6">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] sm:text-[30px] leading-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-2 max-w-[62ch]">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
export const SectionTitle = ({ title, action, sub }) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <div><h2 className="font-display text-base text-ink">{title}</h2>{sub && <p className="text-xs text-ink-3 mt-0.5">{sub}</p>}</div>{action}
  </div>
);
export function EmptyState({ icon: Icon = Inbox, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-softfg"><Icon className="h-6 w-6" /></div>
      <h3 className="font-display text-base text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-[42ch] text-sm text-ink-2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export const Skeleton = ({ className }) => <div className={cn('skeleton', className)} />;
export const Kbd = ({ children }) => <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface-2 px-1.5 font-mono text-[10.5px] text-ink-3">{children}</kbd>;
export const Divider = ({ className }) => <div className={cn('h-px bg-line', className)} />;

/* ── Forms ───────────────────────────────────────────────────────────── */
export function Field({ label, hint, error, required, children, className, htmlFor }) {
  return (
    <div className={className}>
      {label && <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink">{label}{required && <span className="text-bad" aria-hidden>*</span>}</label>}
      {children}
      {error ? <p role="alert" className="mt-1.5 text-xs text-bad-fg">{error}</p> : hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
export const Input = ({ icon: Icon, className, ...p }) => Icon ? (
  <div className="relative"><Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" /><input {...p} className={cn('field pl-9', className)} /></div>
) : <input {...p} className={cn('field', className)} />;
export const Textarea = ({ className, ...p }) => <textarea {...p} className={cn('field resize-y min-h-[96px]', className)} />;
export const Select = ({ className, children, ...p }) => (
  <div className="relative"><select {...p} className={cn('field appearance-none pr-9', className)}>{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" /></div>
);
export function Toggle({ checked, onChange, label, desc, disabled }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer"><span className="block text-sm font-medium text-ink">{label}</span>{desc && <span className="block text-[13px] text-ink-2 mt-0.5">{desc}</span>}</label>
      <button id={id} role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={cn('relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line-strong', disabled && 'opacity-50')}>
        <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </button>
    </div>
  );
}
export function Segmented({ value, onChange, options, size = 'md', className, label }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-md bg-surface-3 p-0.5', className)}>
      {options.map(o => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn('inline-flex items-center justify-center gap-1.5 rounded-[calc(var(--r-md)-2px)] font-medium transition', size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]', value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink')}>
          {o.icon && <o.icon className="h-3.5 w-3.5" />}{o.label}{o.count != null && <span className="num text-ink-3">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex gap-1 border-b border-line overflow-x-auto no-scrollbar', className)}>
      {tabs.map(t => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('relative inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition', value === t.value ? 'text-ink' : 'text-ink-2 hover:text-ink')}>
          {t.icon && <t.icon className="h-4 w-4" />}{t.label}{t.count != null && <span className="num rounded-full bg-surface-3 px-1.5 text-[11px] text-ink-2">{t.count}</span>}
          {value === t.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  );
}
export function Checkbox({ checked, onChange, label, indeterminate, className }) {
  return (
    <button type="button" role="checkbox" aria-checked={indeterminate ? 'mixed' : checked} aria-label={label} onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={cn('inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition', checked || indeterminate ? 'border-accent bg-accent text-accent-on' : 'border-line-strong bg-surface hover:border-ink-3', className)}>
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}{indeterminate && !checked && <span className="h-0.5 w-2 rounded bg-current" />}
    </button>
  );
}
export function Stars({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex gap-0.5" onMouseLeave={() => setHover(0)} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" disabled={!onChange} onMouseEnter={() => onChange && setHover(i)} onClick={() => onChange?.(i)} aria-label={`${i} star${i > 1 ? 's' : ''}`} className={cn(onChange ? 'cursor-pointer' : 'cursor-default')}>
          <Star style={{ width: size, height: size }} className={cn('transition', (hover || value) >= i ? 'fill-warn text-warn' : 'text-line-strong')} />
        </button>
      ))}
    </div>
  );
}
export function FileDrop({ files, onChange }) {
  const ref = useRef(); const [over, setOver] = useState(false);
  const add = (list) => onChange([...files, ...Array.from(list).map(f => ({ name: f.name, size: f.size > 1e6 ? (f.size / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1e3)) + ' KB' }))].slice(0, 5));
  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={cn('flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition', over ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface-2')}>
        <UploadCloud className="h-6 w-6 text-ink-3" />
        <p className="mt-2 text-sm text-ink"><button type="button" onClick={() => ref.current.click()} className="font-medium text-accent-softfg underline underline-offset-2">Choose files</button> or drop them here</p>
        <p className="mt-0.5 text-xs text-ink-3">Screenshots, PDFs or photos. Up to 5 files, 10 MB each.</p>
        <input ref={ref} type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">{files.map((f, i) => (
          <li key={i} className="flex items-center gap-3 rounded-md bg-surface-2 px-3 py-2 text-sm"><FileText className="h-4 w-4 text-ink-3" /><span className="min-w-0 flex-1 truncate">{f.name}</span><span className="num text-xs text-ink-3">{f.size}</span>
            <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))} className="text-ink-3 hover:text-bad"><Trash2 className="h-4 w-4" /></button></li>))}</ul>
      )}
    </div>
  );
}
export const AttachmentChip = ({ a }) => <span className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs"><Paperclip className="h-3.5 w-3.5 text-ink-3" /><span className="font-medium">{a.name}</span><span className="text-ink-3">{a.size}</span></span>;

/* ── Overlays ────────────────────────────────────────────────────────── */
function useLock(open) { useEffect(() => { if (!open) return; const p = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = p; }; }, [open]); }
function useEsc(open, fn) { useEffect(() => { if (!open) return; const h = (e) => e.key === 'Escape' && fn(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [open, fn]); }

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useLock(open); useEsc(open, onClose);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div className={cn('relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-surface shadow-pop animate-pop', w)}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div><h2 className="font-display text-lg text-ink">{title}</h2>{description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}</div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1"><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-6 py-3.5">{footer}</div>}
      </div>
    </div>, document.body);
}
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-md' }) {
  useLock(open); useEsc(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 animate-fade" onClick={onClose} />
      <aside className={cn('absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-pop animate-slideIn', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4"><div><h2 className="font-display text-lg text-ink">{title}</h2>{subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}</div><IconButton label="Close" onClick={onClose} className="-mr-2"><X className="h-4 w-4" /></IconButton></div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-6 py-3.5">{footer}</div>}
      </aside>
    </div>, document.body);
}

/** Click-outside popover. Children receives close(). */
export function Popover({ trigger, children, align = 'right', width = 'w-72', className }) {
  const [open, setOpen] = useState(false); const ref = useRef();
  useEffect(() => { if (!open) return; const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); }; const k = (e) => e.key === 'Escape' && setOpen(false); document.addEventListener('mousedown', h); document.addEventListener('keydown', k); return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); }; }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen(o => !o) })}
      {open && <div className={cn('absolute z-50 mt-2 rounded-xl bg-surface shadow-pop animate-pop', align === 'right' ? 'right-0' : 'left-0', width, className)}>{typeof children === 'function' ? children(() => setOpen(false)) : children}</div>}
    </div>
  );
}
export const MenuItem = ({ icon: Icon, children, danger, onClick, active, className }) => (
  <button onClick={onClick} className={cn('flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-surface-3', danger ? 'text-bad-fg' : 'text-ink', active && 'bg-accent-soft text-accent-softfg', className)}>
    {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}<span className="min-w-0 flex-1 truncate">{children}</span>{active && <Check className="h-4 w-4" />}
  </button>
);

/* ── Toasts ──────────────────────────────────────────────────────────── */
export function Toaster({ toasts, dismiss }) {
  const icon = { ok: CheckCircle2, warn: AlertTriangle, bad: AlertTriangle, info: CheckCircle2 };
  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" role="status" aria-live="polite">
      {toasts.map(t => { const I = icon[t.tone] || CheckCircle2; return (
        <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl bg-sb-bg px-4 py-3 text-sb-fg shadow-pop animate-pop">
          <I className={cn('mt-0.5 h-5 w-5 shrink-0', t.tone === 'bad' ? 'text-bad' : t.tone === 'warn' ? 'text-warn' : 'text-ok')} />
          <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t.title}</p>{t.body && <p className="mt-0.5 text-[13px] opacity-75">{t.body}</p>}{t.action && <button onClick={() => { t.action.run(); dismiss(t.id); }} className="mt-1.5 text-[13px] font-semibold underline underline-offset-2">{t.action.label}</button>}</div>
          <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>); })}
    </div>, document.body);
}

/* ── Data tiles ──────────────────────────────────────────────────────── */
export function StatTile({ label, value, sub, icon: Icon, trend, tone = 'accent', onClick, children }) {
  const T = onClick ? 'button' : 'div';
  return (
    <T onClick={onClick} className={cn('card card-pad text-left w-full', onClick && 'transition hover:shadow-pop')}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        {Icon && <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', TONES[tone])}><Icon className="h-4 w-4" /></span>}
      </div>
      <p className="num mt-2 font-display text-[30px] leading-none text-ink">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-ink-2">{trend && <span className={cn('num font-semibold', trend.good ? 'text-ok-fg' : 'text-bad-fg')}>{trend.text}</span>}<span>{sub}</span></div>
      {children}
    </T>
  );
}
export const Progress = ({ value, tone = 'accent', className }) => (
  <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
    <div className={cn('h-full rounded-full transition-all', { accent: 'bg-accent', ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad' }[tone])} style={{ width: `${Math.min(100, value * 100)}%` }} />
  </div>
);
export const Meta = ({ label, children }) => <div><dt className="text-xs text-ink-3">{label}</dt><dd className="mt-0.5 text-sm text-ink">{children}</dd></div>;
export { timeAgo };
