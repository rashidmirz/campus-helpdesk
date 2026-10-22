import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Lightbulb, Clock, BookOpen, Bell, Copy, Plus } from 'lucide-react';
import { Link, navigate, useRoute } from '../lib/router';
import { useStore, categoryMeta } from '../store/store';
import { CATEGORIES, PRIORITIES, KB } from '../data/seed';
import { cn, safeStorage, duration, HOUR } from '../lib/utils';
import { Button, Card, Field, Input, Textarea, FileDrop, PageHeader, Badge, Toggle } from '../components/ui';
import { NamedIcon } from '../components/ui/icons';

const STEPS = ['Topic', 'Details', 'Review'];
const DRAFT = 'sou.draft.v2';
const PDESC = { low: 'Can wait a few days', medium: 'Needs attention this week', high: 'Blocking my work or study', urgent: 'Safety risk or exam within 7 days' };

export function suggest(text, limit = 3) {
  const words = [...new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3))];
  if (!words.length) return [];
  return KB.map(a => { const hay = `${a.title} ${a.summary}`.toLowerCase(); return { a, s: words.reduce((n, w) => n + (hay.includes(w) ? (a.title.toLowerCase().includes(w) ? 2 : 1) : 0), 0) }; }).filter(x => x.s > 0).sort((x, y) => y.s - x.s).slice(0, limit).map(x => x.a);
}

export function NewTicket() {
  const { actions, toast, user } = useStore(); const { query } = useRoute();
  const draft = useMemo(() => safeStorage.get(DRAFT, {}), []);
  const [step, setStep] = useState(query.cat ? 1 : 0);
  const [f, setF] = useState({ category: query.cat || draft.category || '', subject: query.subject || draft.subject || '', description: query.desc || draft.description || '', priority: draft.priority || 'medium', location: draft.location || '', files: [], notifyEmail: true, notifySms: false });
  const [errs, setErrs] = useState({}); const [done, setDone] = useState(null); const [busy, setBusy] = useState(false); const [dismissed, setDismissed] = useState(false); const [saved, setSaved] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  useEffect(() => { if (done) return; const t = setTimeout(() => { if (f.subject || f.description || f.category) { safeStorage.set(DRAFT, { ...f, files: [] }); setSaved(true); } }, 600); return () => clearTimeout(t); }, [f, done]);
  const cat = f.category && categoryMeta(f.category);
  const sugg = useMemo(() => dismissed ? [] : suggest(`${f.subject} ${f.description}`), [f.subject, f.description, dismissed]);
  const effPriority = f.category === 'safety' ? 'urgent' : f.priority; const pr = PRIORITIES.find(p => p.id === effPriority);

  const next = () => {
    const e = {};
    if (step === 0 && !f.category) e.category = 'Choose the topic that fits best.';
    if (step === 1) { if (f.subject.trim().length < 6) e.subject = 'Give it a short title of at least 6 characters.'; if (f.description.trim().length < 20) e.description = 'Add a little more detail so we can act without asking. At least 20 characters.'; }
    setErrs(e); if (Object.keys(e).length) return; setStep(s => s + 1);
  };
  const submit = async () => {
    setBusy(true);
    try {
      const t = await actions.createTicket({ subject: f.subject.trim(), category: f.category, priority: effPriority, description: f.description.trim(), location: f.location, attachments: f.files });
      safeStorage.del(DRAFT);
      setDone(t);
    } catch (err) {
      // toast shown in store
    } finally {
      setBusy(false);
    }
  };

  if (done) return (
    <div className="mx-auto max-w-xl py-6 text-center animate-pop">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok-fg"><CheckCircle2 className="h-9 w-9" /></span>
      <h1 className="mt-6 font-display text-3xl">Request sent to {categoryMeta(done.category).team}</h1>
      <p className="mt-2 text-ink-2">Your request ID is <button onClick={() => { navigator.clipboard?.writeText(done.id); toast('Request ID copied'); }} className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-0.5 font-mono text-sm font-semibold text-ink">{done.id}<Copy className="h-3.5 w-3.5 opacity-60" /></button></p>
      <Card className="mt-8 text-left">
        <ol className="space-y-5">
          {[['Now', 'Routed to ' + categoryMeta(done.category).team, 'Done'], [`Within ${pr.first} hour${pr.first > 1 ? 's' : ''}`, 'A team member sends the first reply', ''], [`Within ${pr.slaHours >= 24 ? pr.slaHours / 24 + ' day' + (pr.slaHours > 24 ? 's' : '') : pr.slaHours + ' hours'}`, 'Target for resolution. You can watch the countdown.', '']].map(([w, d, s], i) => (
            <li key={i} className="flex gap-4"><span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', i === 0 ? 'bg-accent text-accent-on' : 'bg-surface-3 text-ink-3')}>{i === 0 ? <Check className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}</span><div><p className="text-sm font-semibold">{w}</p><p className="text-sm text-ink-2">{d}</p></div></li>))}
        </ol>
      </Card>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Button size="lg" onClick={() => navigate(`/app/tickets/${done.id}`)}>View request</Button><Button size="lg" variant="secondary" icon={Plus} onClick={() => { setDone(null); setStep(0); setF({ category: '', subject: '', description: '', priority: 'medium', location: '', files: [], notifyEmail: true, notifySms: false }); }}>Raise another</Button></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/app/tickets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" />My requests</Link>
      <PageHeader title="Raise a request" subtitle="Tell us what is wrong and we will send it to the right team." actions={saved && <span className="inline-flex items-center gap-1.5 text-xs text-ink-3"><Check className="h-3.5 w-3.5" />Draft saved</span>} />
      <ol className="mb-8 flex items-center gap-3" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-3 last:flex-none">
            <button disabled={i > step} onClick={() => setStep(i)} className="flex items-center gap-2.5 text-sm font-medium" aria-current={i === step ? 'step' : undefined}>
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[13px] num', i < step ? 'bg-accent text-accent-on' : i === step ? 'bg-accent text-accent-on ring-4 ring-accent/30' : 'bg-surface-3 text-ink-3')}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
              <span className={i === step ? 'text-ink' : 'text-ink-3'}>{s}</span>
            </button>
            {i < STEPS.length - 1 && <span className={cn('h-px flex-1', i < step ? 'bg-accent' : 'bg-line-strong')} />}
          </li>))}
      </ol>

      {step === 0 && (
        <div className="animate-fade">
          <h2 className="font-display text-xl">What is it about?</h2>
          {errs.category && <p role="alert" className="mt-1 text-sm text-bad-fg">{errs.category}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { set('category', c.id); setErrs({}); }} aria-pressed={f.category === c.id}
                className={cn('flex items-start gap-3.5 rounded-xl p-4 text-left transition', f.category === c.id ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface shadow-card hover:shadow-pop')}>
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', f.category === c.id ? 'bg-accent text-accent-on' : 'bg-surface-3 text-ink-2')}><NamedIcon name={c.icon} className="h-5 w-5" /></span>
                <span><span className="block font-medium">{c.name}</span><span className="mt-0.5 block text-[13px] text-ink-2">{c.hint}</span></span>
              </button>))}
          </div>
        </div>)}

      {step === 1 && (
        <div className="grid gap-6 animate-fade lg:grid-cols-[1fr_340px]">
          <Card className="space-y-5">
            <div className="flex items-center gap-2 text-sm"><Badge tone="accent"><NamedIcon name={cat.icon} className="h-3.5 w-3.5" />{cat.name}</Badge><button onClick={() => setStep(0)} className="text-ink-2 underline underline-offset-2 hover:text-ink">Change</button></div>
            <Field label="Title" required error={errs.subject} htmlFor="subj" hint="One line that sums up the problem."><Input id="subj" value={f.subject} onChange={(e) => set('subject', e.target.value)} placeholder="For example: Wi-Fi drops every evening in Block B" maxLength={110} aria-invalid={!!errs.subject} autoFocus /></Field>
            <Field label="What happened?" required error={errs.description} htmlFor="desc" hint="Include when it started, what you tried, and anything that helps us reproduce it."><Textarea id="desc" rows={6} value={f.description} onChange={(e) => set('description', e.target.value)} aria-invalid={!!errs.description} /></Field>
            <Field label="Where is it?" htmlFor="loc" hint="Optional. Building, room or area."><Input id="loc" value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Hostel Block B, 3rd floor" /></Field>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium">How urgent is it?</legend>
              {f.category === 'safety' ? <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad-fg">Safety requests are always treated as urgent and go straight to Campus Security. If someone is in danger call 0 79 2630 5099 now.</p> : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {PRIORITIES.map(p => <button type="button" key={p.id} onClick={() => set('priority', p.id)} aria-pressed={f.priority === p.id} className={cn('rounded-lg border px-4 py-3 text-left transition', f.priority === p.id ? 'border-accent bg-accent-soft' : 'border-line-strong hover:bg-surface-2')}><span className="block text-sm font-medium">{p.name}</span><span className="block text-xs text-ink-2">{PDESC[p.id]}</span></button>)}
                </div>)}
            </fieldset>
          </Card>
          <aside className="space-y-4">
            <Card className="!bg-accent-soft shadow-none">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent-softfg"><Lightbulb className="h-4 w-4" />These may solve it right now</div>
              {sugg.length === 0 ? <p className="mt-2 text-sm text-ink-2">Start typing your title and we will look for matching help articles.</p> : (
                <ul className="mt-3 space-y-2">{sugg.map(a => <li key={a.id}><Link to={`/app/knowledge/${a.slug}`} target="_blank" className="flex items-start gap-2.5 rounded-lg bg-surface p-3 text-sm shadow-card hover:shadow-pop"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span><span className="block font-medium leading-snug">{a.title}</span><span className="text-xs text-ink-3">{a.mins} min read</span></span></Link></li>)}</ul>)}
              {sugg.length > 0 && <button onClick={() => setDismissed(true)} className="mt-3 text-xs font-medium text-ink-2 underline underline-offset-2">None of these help</button>}
            </Card>
            <Card><p className="text-sm font-semibold">What happens next</p><p className="mt-1 text-sm text-ink-2">{categoryMeta(f.category).team} replies within <b className="text-ink">{pr.first} hour{pr.first > 1 ? 's' : ''}</b> and aims to resolve it within <b className="text-ink">{pr.slaHours >= 24 ? `${pr.slaHours / 24} day${pr.slaHours > 24 ? 's' : ''}` : `${pr.slaHours} hours`}</b>.</p></Card>
          </aside>
        </div>)}

      {step === 2 && (
        <div className="grid gap-6 animate-fade lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card><h2 className="font-display text-lg">Add files</h2><p className="mb-4 mt-0.5 text-sm text-ink-2">Screenshots and photos help us fix things faster. Optional.</p><FileDrop files={f.files} onChange={(v) => set('files', v)} /></Card>
            <Card className="divide-y divide-line !py-1"><Toggle label="Email me when there is an update" checked={f.notifyEmail} onChange={(v) => set('notifyEmail', v)} /><Toggle label="Send SMS for urgent changes" desc={`To ${user.phone}`} checked={f.notifySms} onChange={(v) => set('notifySms', v)} /></Card>
          </div>
          <Card className="h-fit">
            <h2 className="font-display text-lg">Review</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-xs text-ink-3">Topic</dt><dd className="mt-0.5 font-medium">{cat.name} · {cat.team}</dd></div>
              <div><dt className="text-xs text-ink-3">Title</dt><dd className="mt-0.5 font-medium">{f.subject}</dd></div>
              <div><dt className="text-xs text-ink-3">Details</dt><dd className="mt-0.5 line-clamp-5 text-ink-2">{f.description}</dd></div>
              {f.location && <div><dt className="text-xs text-ink-3">Location</dt><dd className="mt-0.5">{f.location}</dd></div>}
              <div><dt className="text-xs text-ink-3">Priority</dt><dd className="mt-0.5 font-medium">{pr.name}</dd></div>
              <div><dt className="text-xs text-ink-3">Attachments</dt><dd className="mt-0.5">{f.files.length ? `${f.files.length} file${f.files.length > 1 ? 's' : ''}` : 'None'}</dd></div>
            </dl>
          </Card>
        </div>)}

      <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => (step === 0 ? navigate('/app/tickets') : setStep(s => s - 1))}>{step === 0 ? 'Cancel' : 'Back'}</Button>
        {step < 2 ? <Button iconRight={ArrowRight} onClick={next}>Continue</Button> : <Button size="lg" loading={busy} onClick={submit}>Send request</Button>}
      </div>
    </div>
  );
}
