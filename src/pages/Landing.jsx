import { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Search, Moon, Sun, CheckCircle2, Circle, Clock, ChevronDown, Phone, ShieldCheck, Mail, MapPin, Sparkles, BookOpen } from 'lucide-react';
import { Link, navigate } from '../lib/router';
import { useTheme } from '../lib/theme';
import { useStore, statusMeta, getPerson } from '../store/store';
import { api } from '../services/api';
import { CATEGORIES, PRIORITIES, STATUSES } from '../data/seed';
import { cn, duration, timeAgo } from '../lib/utils';
import { slaOf, isOpen } from '../lib/sla';
import { Button, IconButton, Badge } from '../components/ui';
import { NamedIcon } from '../components/ui/icons';
import { LogoMark, Wordmark } from '../components/layout/Logo';

function TrackerCard() {
  const [q, setQ] = useState('HD-2041');
  const [asked, setAsked] = useState('HD-2041');
  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!asked.trim()) {
      setT(null);
      return;
    }
    setLoading(true);
    api.trackTicket(asked.trim())
      .then(res => {
        if (active) setT(res);
      })
      .catch(() => {
        if (active) setT(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [asked]);

  const steps = ['Submitted', 'Under review', 'In progress', 'Resolved'];
  const step = t ? t.step : 0;
  const now = Date.now();
  const done = t?.status === 'resolved' || t?.status === 'closed';
  const target = done ? t?.resolvedAt : t?.dueAt;
  const remaining = target ? target - now : 0;

  return (
    <div className="relative w-full max-w-[460px] rounded-2xl bg-surface p-6 shadow-pop">
      <h2 className="font-display text-lg">Track a request</h2>
      <p className="mt-0.5 text-sm text-ink-2">Enter the ID from your confirmation email.</p>
      <form onSubmit={(e) => { e.preventDefault(); setAsked(q); }} className="mt-4 flex gap-2">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="HD-2041" aria-label="Request ID" className="field pl-9 font-mono uppercase" /></div>
        <Button type="submit" loading={loading}>Track</Button>
      </form>
      <div className="mt-5 min-h-[250px] rounded-xl bg-surface-2 p-4">
        {loading ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-sm text-ink-3">Checking request status...</div>
        ) : t ? (
          <div className="animate-fade">
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-ink-3">{t.id}</p><p className="mt-0.5 font-medium leading-snug">{t.subject}</p></div><Badge tone={t.statusTone} dot>{t.statusName}</Badge></div>
            <ol className="mt-5 grid grid-cols-4 gap-1" aria-label="Progress">
              {steps.map((s, i) => (
                <li key={s} className="relative">
                  <div className="flex items-center"><span className={cn('flex h-6 w-6 items-center justify-center rounded-full', i <= step ? 'bg-accent text-accent-on' : 'bg-surface-3 text-ink-3')}>{i < step || (i === step && step === 3) ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}</span>{i < 3 && <span className={cn('h-0.5 flex-1', i < step ? 'bg-accent' : 'bg-line-strong')} />}</div>
                  <p className={cn('mt-2 text-[11.5px] leading-tight', i === step ? 'font-semibold text-ink' : 'text-ink-3')}>{s}</p>
                </li>))}
            </ol>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-ink-3">Handled by</dt><dd>{t.assigneeName}</dd></div>
              <div><dt className="text-xs text-ink-3">{done ? 'Closed' : 'Target'}</dt><dd className="num">{done ? timeAgo(t.resolvedAt) : remaining < 0 ? `Overdue by ${duration(remaining)}` : `Within ${duration(remaining)}`}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-ink-3">Latest update</dt><dd>{t.latestUpdate} <span className="text-ink-3">· {timeAgo(t.updatedAt)}</span></dd></div>
            </dl>
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-sm text-ink-2"><p className="font-medium text-ink">No request found for “{asked}”</p><p className="mt-1 max-w-[30ch]">Check the ID in your email. It looks like HD-2041.</p></div>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-3">Public tracking shows status only. Sign in to read messages.</p>
    </div>
  );
}

const FAQ = [
  ['Who can raise a request?', 'Every enrolled student, faculty member and staff member with a university email. Parents and visitors can call the control room or the helpdesk phone line.'],
  ['How quickly will I hear back?', 'Each request has a target based on priority: urgent in 8 hours, high in 24 hours, medium in 3 days and low in 5 days. You can watch the countdown on your request.'],
  ['What counts as urgent?', 'Anything affecting safety, an exam in the next 7 days, or a service that stops many people at once. Exam-related requests inside 7 days are marked urgent automatically.'],
  ['Can I attach photos or documents?', 'Yes. Attach up to five screenshots, photos or PDFs when you raise a request or when you reply later.'],
  ['What if I disagree with the resolution?', 'Reply on the request within 7 days and it reopens with the same owner. You can also rate the outcome, and the Helpdesk Lead reads every low rating.'],
];

export function Landing() {
  const { resolved, toggleMode } = useTheme(); const { tickets } = useStore();
  const [open, setOpen] = useState(0);
  const openCount = tickets.filter(isOpen).length;
  return (
    <div className="min-h-screen bg-app text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-app/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <Link to="/" className="flex items-center gap-3"><LogoMark size={34} /><Wordmark /></Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Site">
            {[['Services', '#services'], ['How it works', '#how'], ['For you', '#roles'], ['FAQ', '#faq']].map(([l, h]) => <a key={l} href={h} onClick={(e) => { e.preventDefault(); document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink">{l}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <IconButton label="Toggle theme" onClick={toggleMode}>{resolved === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</IconButton>
            <Button variant="secondary" size="sm" onClick={() => navigate('/login')} className="hidden sm:inline-flex">Sign in</Button>
            <Button size="sm" onClick={() => navigate('/login')}>Get help</Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="dotgrid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <Badge tone="accent" className="mb-6"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping2 rounded-full bg-accent" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent" /></span>{openCount} requests being worked on right now</Badge>
            <h1 className="font-display text-[44px] leading-[1.02] sm:text-[60px] lg:text-[68px]">Every campus problem, tracked until it is solved.</h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-2">Raise a request for Wi-Fi, hostel, fees, exams or certificates. See who owns it, how long it should take, and what happens next, without chasing anyone.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => navigate('/login')} iconRight={ArrowRight}>Sign in to raise a request</Button>
              <Button size="lg" variant="secondary" icon={BookOpen} onClick={() => navigate('/login')}>Browse help articles</Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-2"><ShieldCheck className="h-4 w-4 text-ok" />In an emergency call the 24×7 control room on <a className="font-medium text-ink underline underline-offset-2" href="tel:07926305099">0 79 2630 5099</a></p>
          </div>
          <div className="flex justify-center lg:justify-end"><TrackerCard /></div>
        </div>
      </section>

      <section id="services" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-20">
          <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
            <div><h2 className="font-display text-3xl sm:text-4xl">Ten teams, one front door</h2><p className="mt-4 text-ink-2 leading-relaxed">Pick what your problem is about and we route it to the people who can fix it. No more guessing whose office to visit.</p></div>
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {CATEGORIES.map(c => (
                <li key={c.id} className="flex items-start gap-4 border-b border-line py-5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-softfg"><NamedIcon name={c.icon} className="h-5 w-5" /></span>
                  <div><h3 className="font-medium">{c.name}</h3><p className="mt-0.5 text-sm text-ink-2">{c.hint}</p><p className="mt-1 text-xs text-ink-3">{c.team}</p></div>
                </li>))}
            </ul>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] px-5 py-20">
        <h2 className="font-display text-3xl sm:text-4xl max-w-[20ch]">From problem to resolved in four steps</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-4">
          {[['Raise it', 'Choose a topic, describe the problem and attach a photo. Our suggestions often answer it before you finish typing.'], ['We route it', 'The right team receives it with a priority and a countdown. You get a request ID right away.'], ['Work happens in the open', 'Replies, status changes and requests for information show up on one timeline and in your notifications.'], ['Resolved, then rated', 'Confirm the fix and rate it in one tap. Low ratings go straight to the Helpdesk Lead.']].map(([t, d], i) => (
            <li key={t} className="relative">
              <div className="flex items-center gap-3"><span className="num flex h-9 w-9 items-center justify-center rounded-full bg-surface font-display text-sm text-ink shadow-card">{i + 1}</span>{i < 3 && <span className="hidden h-px flex-1 bg-line-strong md:block" />}</div>
              <h3 className="mt-5 font-display text-lg">{t}</h3><p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
            </li>))}
        </ol>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-4">
          {PRIORITIES.slice().reverse().map(p => <div key={p.id} className="bg-surface p-5"><p className="text-sm text-ink-2">{p.name} priority</p><p className="num mt-1 font-display text-2xl">{p.slaHours >= 24 ? `${p.slaHours / 24} day${p.slaHours > 24 ? 's' : ''}` : `${p.slaHours} hours`}</p><p className="mt-1 text-xs text-ink-3">to resolve · first reply in {p.first}h</p></div>)}
        </div>
      </section>

      <section id="roles" className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-px bg-line px-0 md:grid-cols-3">
          {[
            ['Students', ['Raise and track requests from any device', 'Download hall tickets and certificates', 'Pay fees and keep receipts', 'Report and claim lost items']],
            ['Faculty', ['Book rooms and report equipment faults', 'See exam duties and invigilation', 'Follow requests raised by your students', 'Get notified of campus announcements']],
            ['Helpdesk team', ['One queue with SLA clocks and filters', 'Assign, reply, add private notes', 'Reply faster with saved responses', 'Live analytics on volume and satisfaction']],
          ].map(([t, li]) => <div key={t} className="bg-surface p-8"><h3 className="font-display text-xl">{t}</h3><ul className="mt-4 space-y-3">{li.map(x => <li key={x} className="flex gap-3 text-sm text-ink-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{x}</li>)}</ul></div>)}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-[820px] px-5 py-20">
        <h2 className="font-display text-3xl sm:text-4xl">Questions people ask</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a], i) => (
            <div key={q}><button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 py-5 text-left font-medium"><span>{q}</span><ChevronDown className={cn('h-5 w-5 shrink-0 text-ink-3 transition', open === i && 'rotate-180')} /></button>{open === i && <p className="pb-5 pr-10 leading-relaxed text-ink-2 animate-fade">{a}</p>}</div>))}
        </div>
        <div className="mt-14 rounded-2xl bg-sb-bg p-8 text-sb-fg sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl max-w-[22ch]">Something broken right now? Start a request in under a minute.</h2>
          <Button variant="primary" size="lg" className="mt-6" onClick={() => navigate('/login')} iconRight={ArrowRight}>Sign in and get help</Button>
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-10 text-sm text-ink-2 md:grid-cols-3">
          <div><div className="flex items-center gap-3"><LogoMark size={30} /><Wordmark /></div><p className="mt-4 max-w-[34ch]">The student and staff helpdesk for Silver Oak University, Ahmedabad.</p></div>
          <ul className="space-y-2"><li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5" />Helpdesk 0 79 2630 5000, 9 AM to 6 PM</li><li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 text-bad" />Control room 0 79 2630 5099, 24×7</li><li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5" />helpdesk@silveroak.edu.in</li><li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5" />Administrative Block, Ground floor</li></ul>
          <p className="md:text-right">© 2026 Silver Oak University. Frontend prototype with sample data.</p>
        </div>
      </footer>
    </div>
  );
}
