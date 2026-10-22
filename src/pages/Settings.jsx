import { useMemo, useState } from 'react';
import { Sun, Moon, Monitor, Check, RotateCcw, Copy, User, Palette, Bell, Wrench, Database, Plus, Trash2, Upload, ClipboardPaste, Type, Layers } from 'lucide-react';
import { navigate, useRoute } from '../lib/router';
import { useStore } from '../store/store';
import { useTheme, ACCENTS, FONTS, PRESETS, DEFAULTS } from '../lib/theme';
import { isHex, luminance, hexToRgb } from '../lib/color';
import { CATEGORIES, PRIORITIES } from '../data/seed';
import { cn, safeStorage } from '../lib/utils';
import { Button, Card, Field, Input, Textarea, Select, Segmented, Tabs, Toggle, PageHeader, Avatar, Badge, Modal, Divider, StatusPill, Progress } from '../components/ui';
import { LogoMark } from '../components/layout/Logo';
import { Sparkline } from '../components/charts';

function ProfileTab() {
  const { user, updateProfile, toast } = useStore();
  const [f, setF] = useState({ name: user.name, email: user.email, phone: user.phone });
  const dirty = f.name !== user.name || f.phone !== user.phone;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="space-y-5">
        <div className="flex items-center gap-4"><Avatar name={f.name} size={64} /><div><p className="font-display text-lg">{f.name}</p><p className="text-sm text-ink-2">{user.title}</p></div></div>
        <Divider />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="pn"><Input id="pn" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone" htmlFor="pp"><Input id="pp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="University email" htmlFor="pe" hint="Managed by the university."><Input id="pe" value={f.email} disabled className="opacity-70" /></Field>
          <Field label={user.idLabel} htmlFor="pi"><Input id="pi" value={user.idValue} disabled className="opacity-70 font-mono" /></Field>
        </div>
        <div className="flex justify-end gap-2"><Button variant="ghost" disabled={!dirty} onClick={() => setF({ name: user.name, email: user.email, phone: user.phone })}>Discard</Button><Button disabled={!dirty || f.name.trim().length < 2} onClick={() => { updateProfile({ name: f.name.trim(), phone: f.phone }); toast('Profile saved'); }}>Save changes</Button></div>
      </Card>
      <Card><h2 className="font-display text-base">Academic details</h2><dl className="mt-4 space-y-3 text-sm">{Object.entries(user.extra).map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0"><dt className="capitalize text-ink-2">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}<div className="flex justify-between gap-4"><dt className="text-ink-2">Department</dt><dd className="text-right font-medium">{user.dept}</dd></div></dl></Card>
    </div>
  );
}

function Swatch({ hex, label, active, onClick }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={active} title={label} className={cn('group relative flex h-11 w-11 items-center justify-center rounded-full transition', active ? 'ring-2 ring-offset-2 ring-offset-surface' : 'hover:scale-105')} style={{ background: hex, '--tw-ring-color': hex }}>
      {active && <Check className="h-5 w-5" strokeWidth={3} style={{ color: luminance(hexToRgb(hex)) > 0.45 ? '#141822' : '#fff' }} />}
    </button>
  );
}

function Preview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-app shadow-card" aria-label="Live preview">
      <div className="flex min-h-[400px]">
        <div className="flex w-14 shrink-0 flex-col items-center gap-3 bg-sb-bg py-4 sm:w-40 sm:items-stretch sm:px-3">
          <div className="flex items-center gap-2 sm:px-1"><LogoMark size={26} /><span className="hidden font-display text-sm text-sb-fg sm:block">Silver Oak</span></div>
          {['Overview', 'My requests', 'Knowledge', 'Exams'].map((l, i) => <div key={l} className={cn('flex h-8 items-center rounded-lg text-xs font-medium sm:px-2.5', i === 1 ? 'bg-sb-active text-sb-activefg justify-center sm:justify-start' : 'text-sb-fg/75 justify-center sm:justify-start')}><span className="hidden sm:block">{l}</span><span className="sm:hidden h-1.5 w-1.5 rounded-full bg-current" /></div>)}
        </div>
        <div className="min-w-0 flex-1 space-y-3 overflow-hidden p-4">
          <div className="flex items-start justify-between"><div><p className="font-display text-xl leading-tight">My requests</p><p className="text-xs text-ink-2">Track everything you have raised.</p></div><span className="inline-flex ctl shrink-0 items-center whitespace-nowrap rounded-md bg-accent px-3 text-xs font-medium text-accent-on">New request</span></div>
          <div className="card divide-y divide-line">
            {[['Wi-Fi drops in Block B', 'in_progress', 'HD-2041'], ['Hall ticket shows wrong centre', 'in_review', 'HD-2036']].map(([s, st, id]) => <div key={id} className="flex items-center justify-between gap-2 px-3 row-pad"><div className="min-w-0"><p className="truncate text-[13px] font-medium">{s}</p><p className="font-mono text-[10px] text-ink-3">{id}</p></div><StatusPill status={st} /></div>)}
          </div>
          <div className="grid grid-cols-2 gap-3"><div className="card card-pad !p-3"><p className="text-[11px] text-ink-2">Open</p><p className="num font-display text-2xl">3</p><Progress value={.6} className="mt-1" /></div><div className="card card-pad !p-3"><p className="text-[11px] text-ink-2">Rating</p><Sparkline data={[3, 4, 3.5, 4.5, 4.4, 5]} width={110} height={30} /></div></div>
          <div className="flex flex-wrap items-center gap-2"><Badge tone="accent">Accent</Badge><Badge tone="ok" dot>On track</Badge><Badge tone="warn" dot>At risk</Badge><span className="inline-flex h-8 items-center rounded-md border border-line-strong bg-surface px-3 text-xs font-medium">Secondary</span></div>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { settings, update, reset, applyPreset } = useTheme(); const { toast } = useStore();
  const [hex, setHex] = useState(settings.custom); const [codeOpen, setCodeOpen] = useState(false); const [code, setCode] = useState('');
  const exportCode = useMemo(() => btoa(JSON.stringify(settings)), [settings]);
  const importCode = () => { try { const v = JSON.parse(atob(code.trim())); update({ ...DEFAULTS, ...v }); setCodeOpen(false); toast('Theme applied'); } catch { toast({ title: 'That code is not valid', body: 'Copy the full theme code from another device.', tone: 'bad' }); } };
  const Section = ({ icon: I, title, desc, children }) => <Card><div className="mb-4 flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-3 text-ink-2"><I className="h-4 w-4" /></span><div><h2 className="font-display text-base">{title}</h2>{desc && <p className="text-[13px] text-ink-2">{desc}</p>}</div></div>{children}</Card>;
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
      <div className="space-y-6">
        <Section icon={Layers} title="Start from a look" desc="One click sets colour, type, corners, density and sidebar. Tweak anything after.">
          <div className="grid gap-3 sm:grid-cols-2">{PRESETS.map(p => { const on = Object.entries(p.s).every(([k, v]) => settings[k] === v); return (
            <button key={p.id} onClick={() => applyPreset(p)} aria-pressed={on} className={cn('rounded-xl border p-4 text-left transition', on ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2')}>
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-full" style={{ background: ACCENTS.find(a => a.id === p.s.accent).hex }} /><span className="font-medium">{p.name}</span>{on && <Check className="ml-auto h-4 w-4 text-accent" />}</div><p className="mt-1 text-[13px] text-ink-2">{p.desc}</p></button>); })}</div>
        </Section>
        <Section icon={Sun} title="Mode">
          <Segmented value={settings.mode} onChange={(v) => update({ mode: v })} label="Mode" options={[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'Match device', icon: Monitor }]} />
        </Section>
        <Section icon={Layers} title="Page background" desc="Paint the whole portal in your accent colour with white panels and dark brand-tinted text, or keep a light grey page. Brand background applies in light mode.">
          <Segmented value={settings.canvas} onChange={(v) => update({ canvas: v })} label="Page background" options={[{ value: 'brand', label: 'Brand colour' }, { value: 'light', label: 'Light grey' }]} />
        </Section>
        <Section icon={Palette} title="Accent colour" desc="Buttons, links, charts and highlights follow this colour.">
          <div className="flex flex-wrap items-center gap-3">{ACCENTS.map(a => <Swatch key={a.id} hex={a.hex} label={a.name} active={settings.accent === a.id} onClick={() => update({ accent: a.id })} />)}</div>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <Field label="Custom colour" htmlFor="hx" className="w-44" error={hex && !isHex(hex) ? 'Use a hex like #7A3FF2' : undefined}><div className="flex gap-2"><input type="color" aria-label="Pick a colour" value={isHex(hex) ? (hex.startsWith('#') ? hex : '#' + hex).slice(0, 7) : '#2F4BDB'} onChange={(e) => { setHex(e.target.value); update({ accent: 'custom', custom: e.target.value }); }} className="h-[var(--ctl-h)] w-12 cursor-pointer rounded-md border border-line-strong bg-surface p-1" /><Input id="hx" value={hex} onChange={(e) => { setHex(e.target.value); if (isHex(e.target.value)) update({ accent: 'custom', custom: e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value }); }} className="font-mono uppercase" maxLength={7} /></div></Field>
            {settings.accent === 'custom' && <Badge tone="accent">Custom in use</Badge>}
          </div>
        </Section>
        <Section icon={Type} title="Typeface" desc="Headings and body text.">
          <div className="grid gap-3 sm:grid-cols-2">{FONTS.map(f => <button key={f.id} data-font={f.id} onClick={() => update({ font: f.id })} aria-pressed={settings.font === f.id} className={cn('rounded-xl border p-4 text-left transition', settings.font === f.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2')}><span className="font-display block text-xl leading-tight">Raise a request</span><span className="mt-1 block text-[13px] text-ink-2" style={{ fontFamily: 'var(--font-body)' }}>{f.name} · {f.note}</span></button>)}</div>
        </Section>
        <div className="grid gap-6 md:grid-cols-2">
          <Section icon={Layers} title="Corners"><div className="flex gap-3">{[['sharp', 'Sharp', '2px'], ['soft', 'Soft', '10px'], ['round', 'Round', '20px']].map(([v, l, r]) => <button key={v} onClick={() => update({ radius: v })} aria-pressed={settings.radius === v} className={cn('flex flex-1 flex-col items-center gap-2 rounded-xl border p-3 text-sm transition', settings.radius === v ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2')}><span className="h-9 w-12 border-2 border-accent bg-accent/10" style={{ borderRadius: r }} />{l}</button>)}</div></Section>
          <Section icon={Layers} title="Density" desc="Space between rows and controls."><Segmented value={settings.density} onChange={(v) => update({ density: v })} label="Density" options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]} /></Section>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Section icon={Layers} title="Sidebar style"><Segmented value={settings.sidebar} onChange={(v) => update({ sidebar: v })} label="Sidebar" options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'accent', label: 'Accent' }]} /></Section>
          <Section icon={Type} title="Text size"><div className="flex items-center gap-4"><span className="text-xs">A</span><input type="range" min="0.9" max="1.2" step="0.05" value={settings.scale} onChange={(e) => update({ scale: +e.target.value })} aria-label="Text size" className="h-2 flex-1 accent-[rgb(var(--ac))]" /><span className="text-xl">A</span><span className="num w-10 text-right text-sm text-ink-2">{Math.round(settings.scale * 100)}%</span></div></Section>
        </div>
        <Card className="divide-y divide-line !py-1"><Toggle label="Reduce motion" desc="Turns off transitions and animations across the portal." checked={settings.motion === 'reduced'} onChange={(v) => update({ motion: v ? 'reduced' : 'full' })} /></Card>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Copy} onClick={() => { navigator.clipboard?.writeText(exportCode); toast({ title: 'Theme code copied', body: 'Paste it on another device with “Apply code”.' }); }}>Copy theme code</Button>
          <Button variant="secondary" icon={ClipboardPaste} onClick={() => setCodeOpen(true)}>Apply code</Button>
          <Button variant="ghost" icon={RotateCcw} onClick={() => { reset(); setHex(DEFAULTS.custom); toast('Appearance reset to default'); }}>Reset to default</Button>
        </div>
      </div>
      <div className="xl:sticky xl:top-2"><p className="mb-2 text-sm font-medium">Live preview</p><Preview /><p className="mt-3 text-xs text-ink-3">Changes apply instantly across the whole portal and are saved on this device.</p></div>
      <Modal open={codeOpen} onClose={() => setCodeOpen(false)} title="Apply theme code" description="Paste a code copied from another device." footer={<><Button variant="ghost" onClick={() => setCodeOpen(false)}>Cancel</Button><Button onClick={importCode} disabled={!code.trim()}>Apply</Button></>}><Textarea value={code} onChange={(e) => setCode(e.target.value)} rows={4} className="font-mono text-xs" aria-label="Theme code" /></Modal>
    </div>
  );
}

function NotificationsTab() {
  const [s, setS] = useState(() => safeStorage.get('sou.notif.v2', { email: true, sms: false, push: true, digest: false, reply: true, status: true, sla: true, events: false, marketing: false }));
  const { toast } = useStore(); const set = (k) => (v) => { const n = { ...s, [k]: v }; setS(n); safeStorage.set('sou.notif.v2', n); };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="divide-y divide-line !py-1"><div className="py-3"><h2 className="font-display text-base">Channels</h2></div><Toggle label="Email" desc="Sent to your university email." checked={s.email} onChange={set('email')} /><Toggle label="SMS" desc="Only for urgent changes." checked={s.sms} onChange={set('sms')} /><Toggle label="In-app notifications" checked={s.push} onChange={set('push')} /><Toggle label="Daily digest" desc="One email at 8 AM instead of many." checked={s.digest} onChange={set('digest')} /></Card>
      <Card className="divide-y divide-line !py-1"><div className="py-3"><h2 className="font-display text-base">What to tell me about</h2></div><Toggle label="Replies on my requests" checked={s.reply} onChange={set('reply')} /><Toggle label="Status changes" checked={s.status} onChange={set('status')} /><Toggle label="Requests that need my input" checked={s.sla} onChange={set('sla')} /><Toggle label="Campus events" checked={s.events} onChange={set('events')} /></Card>
    </div>
  );
}

function HelpdeskTab() {
  const { cannedReplies, actions, toast } = useStore(); const [t, setT] = useState(''); const [b, setB] = useState('');
  return (
    <div className="space-y-6">
      <Card pad={false} className="overflow-hidden"><div className="px-5 pt-5"><h2 className="font-display text-base">Topics, teams and targets</h2><p className="mb-3 text-[13px] text-ink-2">Each topic routes to a team. Targets come from the priority a requester picks.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-y border-line bg-surface-2 text-left text-xs font-medium text-ink-3"><th className="px-5 py-2.5">Topic</th><th>Team</th><th>Description</th></tr></thead><tbody>{CATEGORIES.map(c => <tr key={c.id} className="border-b border-line last:border-0"><td className="px-5 row-pad font-medium">{c.name}</td><td className="text-ink-2">{c.team}</td><td className="text-ink-2">{c.hint}</td></tr>)}</tbody></table></div></Card>
      <Card pad={false} className="overflow-hidden"><div className="px-5 pt-5"><h2 className="font-display text-base">Service targets</h2></div><div className="mt-3 grid gap-px bg-line sm:grid-cols-4">{PRIORITIES.map(p => <div key={p.id} className="bg-surface p-5"><p className="text-sm text-ink-2">{p.name}</p><p className="num mt-1 font-display text-2xl">{p.slaHours}h</p><p className="text-xs text-ink-3">to resolve · first reply {p.first}h</p></div>)}</div></Card>
      <Card><h2 className="font-display text-base">Saved replies</h2><p className="mb-4 text-[13px] text-ink-2">Agents insert these from the reply box.</p>
        <ul className="divide-y divide-line">{cannedReplies.map(c => <li key={c.id} className="flex items-start gap-4 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{c.title}</p><p className="line-clamp-2 text-[13px] text-ink-2">{c.body}</p></div><button aria-label={`Delete ${c.title}`} onClick={() => actions.removeCanned(c.id)} className="text-ink-3 hover:text-bad"><Trash2 className="h-4 w-4" /></button></li>)}</ul>
        <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[220px_1fr_auto]"><Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Title" aria-label="Reply title" /><Input value={b} onChange={(e) => setB(e.target.value)} placeholder="Message" aria-label="Reply message" /><Button icon={Plus} disabled={!t.trim() || !b.trim()} onClick={() => { actions.addCanned({ title: t.trim(), body: b.trim() }); setT(''); setB(''); toast('Saved reply added'); }}>Add</Button></div></Card>
    </div>
  );
}

function DataTab() {
  const { actions, toast } = useStore(); const { reset } = useTheme(); const [open, setOpen] = useState(false);
  return (
    <Card className="max-w-2xl"><h2 className="font-display text-base">Demo data</h2><p className="mt-1 text-sm text-ink-2">This prototype saves everything in your browser. Reset to start again with the original sample requests, notifications and fees.</p>
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="danger" icon={RotateCcw} onClick={() => setOpen(true)}>Reset demo data</Button></div>
      <Modal open={open} onClose={() => setOpen(false)} size="sm" title="Reset all demo data?" description="Requests you created, ratings and payments will be removed. Your appearance settings stay." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => { actions.resetDemo(); setOpen(false); toast('Demo data reset'); }}>Reset data</Button></>} />
    </Card>
  );
}

export function Settings() {
  const { query } = useRoute(); const { user } = useStore();
  const tab = query.tab || 'profile';
  const tabs = [{ value: 'profile', label: 'Profile', icon: User }, { value: 'appearance', label: 'Appearance', icon: Palette }, { value: 'notifications', label: 'Notifications', icon: Bell }, ...(user.role === 'admin' ? [{ value: 'helpdesk', label: 'Helpdesk setup', icon: Wrench }] : []), { value: 'data', label: 'Demo data', icon: Database }];
  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile, how the portal looks, and how we contact you." />
      <Tabs tabs={tabs} value={tab} onChange={(v) => navigate(`/app/settings?tab=${v}`, { replace: true })} className="mb-6" />
      {tab === 'profile' && <ProfileTab />}{tab === 'appearance' && <AppearanceTab />}{tab === 'notifications' && <NotificationsTab />}{tab === 'helpdesk' && user.role === 'admin' && <HelpdeskTab />}{tab === 'data' && <DataTab />}
    </div>
  );
}
