import { useMemo } from 'react';
import { Plus, Ticket, CalendarClock, Wallet, GraduationCap, ArrowRight, AlertTriangle, CheckCircle2, Megaphone, ClipboardCheck, FileBadge, PackageSearch, BookOpen, Bot, Users, Clock, Inbox, Presentation, Star, MessageSquare, Check, Info, Sparkles } from 'lucide-react';
import { Link, navigate } from '../lib/router';
import { useStore, getPerson, statusMeta, categoryMeta, useNow } from '../store/store';
import { EXAMS, EVENTS, AGENTS, PRIORITIES } from '../data/seed';
import { isOpen, slaOf } from '../lib/sla';
import { buildAnalytics } from '../lib/analytics';
import { cn, greeting, timeAgo, money, fmtDate, DAY, duration } from '../lib/utils';
import { Button, Card, StatTile, SectionTitle, StatusPill, SlaChip, PriorityPill, Avatar, Badge, Progress, Select, EmptyState } from '../components/ui';
import { NamedIcon } from '../components/ui/icons';
import { LineChart, Sparkline, HBars } from '../components/charts';

const ANN_TONE = { warn: ['bg-warn-soft text-warn-fg', AlertTriangle], info: ['bg-info-soft text-info-fg', Info], ok: ['bg-ok-soft text-ok-fg', CheckCircle2] };

function Announcements({ limit = 3 }) {
  const { announcements } = useStore(); const list = [...announcements].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.at - a.at).slice(0, limit);
  return (
    <Card pad={false}><div className="px-5 pt-5"><SectionTitle title="Announcements" /></div>
      <ul className="divide-y divide-line">{list.map(a => { const [c, I] = ANN_TONE[a.tone] || ANN_TONE.info; return (
        <li key={a.id} className="flex gap-3 px-5 py-3.5"><span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', c)}><I className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-medium leading-snug">{a.title}</p><p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{a.body}</p><p className="mt-1 text-xs text-ink-3">{a.by} · {timeAgo(a.at)}</p></div></li>); })}</ul>
    </Card>
  );
}

function RequestRow({ t, now, who }) {
  const cat = categoryMeta(t.category);
  return (
    <Link to={`/app/tickets/${t.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2">
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-2 sm:flex"><NamedIcon name={cat.icon} className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium group-hover:text-accent-softfg">{t.subject}</p><p className="mt-0.5 flex items-center gap-2 text-xs text-ink-3"><span className="font-mono">{t.id}</span><span>·</span>{who || `Updated ${timeAgo(t.updatedAt)}`}</p></div>
      <div className="hidden items-center gap-3 sm:flex"><StatusPill status={t.status} /></div><SlaChip ticket={t} now={now} />
    </Link>
  );
}

function StudentDash() {
  const { user, tickets, fees, checklist, actions, eventRegs } = useStore(); const now = useNow(30000);
  const mine = tickets.filter(t => t.requesterId === user.id).sort((a, b) => b.updatedAt - a.updatedAt);
  const open = mine.filter(isOpen); const waiting = mine.filter(t => t.status === 'waiting'); const unrated = mine.filter(t => t.status === 'resolved' && !t.csat);
  const due = fees.filter(f => f.status === 'due').reduce((a, f) => a + f.amount, 0); const nextExam = EXAMS[0];
  const items = [['profile', 'Review your profile details', '/app/settings'], ['request', 'Raise your first request', '/app/tickets/new'], ['kb', 'Read a help article', '/app/knowledge'], ['theme', 'Make the portal yours', '/app/settings?tab=appearance']];
  const done = items.filter(([k]) => checklist[k] || (k === 'request' && mine.length > 0)).length;
  const att = [...waiting.map(t => ({ t, msg: 'Waiting on your reply', tone: 'warn' })), ...unrated.map(t => ({ t, msg: 'Rate how we did', tone: 'accent' }))];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-[28px] sm:text-[34px] leading-tight">{greeting()}, {user.name.split(' ')[0]}</h1><p className="mt-1 text-ink-2">{user.title} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
        <Button icon={Plus} onClick={() => navigate('/app/tickets/new')}>New request</Button>
      </div>
      {att.length > 0 && (
        <div className="rounded-xl bg-accent-soft p-1.5 ring-1 ring-accent/20">
          <p className="px-3.5 pb-1 pt-2.5 text-sm font-semibold text-accent-softfg">Needs your attention</p>
          {att.map(({ t, msg }) => <Link key={t.id} to={`/app/tickets/${t.id}`} className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 hover:bg-ink/10"><span className="h-2 w-2 shrink-0 rounded-full bg-accent" /><span className="min-w-0 flex-1 truncate text-sm"><b className="font-medium">{msg}</b> · {t.subject}</span><ArrowRight className="h-4 w-4 text-accent-softfg" /></Link>)}
        </div>)}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Open requests" value={open.length} icon={Ticket} sub={waiting.length ? `${waiting.length} waiting on you` : 'All on track'} onClick={() => navigate('/app/tickets')} />
        <StatTile label="Next exam" value={`${nextExam.in} days`} icon={CalendarClock} tone="violet" sub={`${nextExam.name}, ${fmtDate(Date.now() + nextExam.in * DAY)}`} onClick={() => navigate('/app/exams')} />
        <StatTile label="Fees due" value={money(due)} icon={Wallet} tone={due ? 'warn' : 'ok'} sub={due ? 'Next deadline 25 Oct' : 'You are all paid up'} onClick={() => navigate('/app/fees')} />
        <StatTile label="Attendance" value={user.extra.attendance} icon={GraduationCap} tone="ok" sub={`CGPA ${user.extra.cgpa}`}><div className="mt-3"><Progress value={0.885} tone="ok" /></div></StatTile>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card pad={false}><div className="flex items-center justify-between px-5 pt-5"><SectionTitle title="Your requests" /><Link to="/app/tickets" className="mb-3 text-[13px] font-medium text-accent-softfg hover:underline">View all</Link></div>
            {open.length ? <div className="divide-y divide-line">{open.slice(0, 4).map(t => <RequestRow key={t.id} t={t} now={now} who={t.assigneeId ? `With ${getPerson(t.assigneeId).name}` : 'Awaiting assignment'} />)}</div> : <EmptyState title="Nothing open" body="Everything you raised has been resolved. Raise a new request any time." action={<Button icon={Plus} onClick={() => navigate('/app/tickets/new')}>New request</Button>} />}
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['Report a lost item', PackageSearch, '/app/lost-found', 'Post it and get matched'], ['Request a certificate', FileBadge, '/app/documents', 'Bonafide, NOC, transcript'], ['Download hall ticket', ClipboardCheck, '/app/exams', 'Seat and exam centre'], ['Ask Oak', Bot, '/app/assistant', 'Instant answers, any time']].map(([l, I, to, d]) => (
              <Link key={l} to={to} className="card flex items-center gap-4 p-4 transition hover:shadow-pop"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-softfg"><I className="h-5 w-5" /></span><span><span className="block font-medium">{l}</span><span className="text-[13px] text-ink-2">{d}</span></span><ArrowRight className="ml-auto h-4 w-4 text-ink-3" /></Link>))}
          </div>
          <Card><SectionTitle title="Semester results" sub="SGPA across your six semesters" /><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="num font-display text-4xl">{user.extra.cgpa}</p><p className="text-sm text-ink-2">Cumulative GPA</p></div><Sparkline data={[8.4, 8.65, 9.1, 9.2, 9.05, 9.15]} width={320} height={64} /></div></Card>
        </div>
        <div className="space-y-6">
          {done < items.length && (
            <Card><div className="flex items-center justify-between"><h2 className="font-display text-base">Getting started</h2><span className="num text-xs text-ink-3">{done} of {items.length}</span></div><Progress value={done / items.length} className="mt-3" />
              <ul className="mt-4 space-y-1">{items.map(([k, l, to]) => { const d = checklist[k] || (k === 'request' && mine.length > 0); return <li key={k}><Link to={to} onClick={() => actions.toggleChecklist(k)} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-3"><span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', d ? 'border-accent bg-accent text-accent-on' : 'border-line-strong')}>{d && <Check className="h-3 w-3" strokeWidth={3} />}</span><span className={d ? 'text-ink-3 line-through' : ''}>{l}</span></Link></li>; })}</ul></Card>)}
          <Announcements />
          <Card pad={false}><div className="px-5 pt-5"><SectionTitle title="Coming up" /></div>
            <ul className="divide-y divide-line">{[...EXAMS.slice(0, 2).map(e => ({ k: 'Exam', t: e.name, d: e.in, s: e.time })), ...EVENTS.filter(e => eventRegs.includes(e.id)).map(e => ({ k: 'Event', t: e.title, d: e.in, s: `${e.time} · ${e.venue}` }))].sort((a, b) => a.d - b.d).map((x, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3"><div className="w-11 shrink-0 text-center"><p className="num font-display text-xl leading-none">{new Date(Date.now() + x.d * DAY).getDate()}</p><p className="text-[11px] text-ink-3">{new Date(Date.now() + x.d * DAY).toLocaleDateString('en-IN', { month: 'short' })}</p></div><div className="min-w-0"><p className="truncate text-sm font-medium">{x.t}</p><p className="truncate text-xs text-ink-3">{x.k} · {x.s}</p></div></li>))}</ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FacultyDash() {
  const { user, tickets, eventRegs } = useStore(); const now = useNow(30000);
  const mine = tickets.filter(t => t.requesterId === user.id).sort((a, b) => b.updatedAt - a.updatedAt); const open = mine.filter(isOpen);
  const schedule = [['9:00', 'Artificial Intelligence', 'CS501 · LH-3 · 5th sem', 'Lecture'], ['11:00', 'Advanced Compiler Design', 'CS602 · LH-7 · 6th sem', 'Lecture'], ['2:00', 'Machine Learning Lab', 'CS604 · Lab 2 · Batch B', 'Lab'], ['4:00', 'Office hours', 'CSE Block · 312', 'Open door']];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-[28px] sm:text-[34px] leading-tight">{greeting()}, {user.name.replace('Dr. ', 'Dr. ').split(' ').slice(0, 2).join(' ')}</h1><p className="mt-1 text-ink-2">{user.title} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div><Button icon={Plus} onClick={() => navigate('/app/tickets/new')}>New request</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Open requests" value={open.length} icon={Ticket} sub={open.some(t => t.priority === 'high') ? '1 marked high priority' : 'All on track'} onClick={() => navigate('/app/tickets')} />
        <StatTile label="Classes today" value="3" icon={Presentation} tone="violet" sub="1 lab, 2 lectures" />
        <StatTile label="Students taught" value={user.extra.students} icon={Users} tone="ok" sub="Across 3 courses" />
        <StatTile label="Exam duties" value="2" icon={ClipboardCheck} tone="warn" sub="Next on 20 Oct, Hall A-04" onClick={() => navigate('/app/exams')} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card pad={false}><div className="px-5 pt-5"><SectionTitle title="Today’s schedule" /></div>
            <ol className="divide-y divide-line">{schedule.map(([h, t, s, k], i) => <li key={h} className="flex items-center gap-4 px-5 py-3.5"><span className="num w-14 text-sm font-medium text-ink-2">{h} {i < 2 ? 'AM' : 'PM'}</span><span className="h-8 w-1 rounded-full bg-accent" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{t}</p><p className="text-xs text-ink-3">{s}</p></div><Badge tone={k === 'Lab' ? 'violet' : k === 'Lecture' ? 'accent' : 'neutral'}>{k}</Badge></li>)}</ol></Card>
          <Card pad={false}><div className="flex items-center justify-between px-5 pt-5"><SectionTitle title="Your requests" /><Link to="/app/tickets" className="mb-3 text-[13px] font-medium text-accent-softfg hover:underline">View all</Link></div>
            <div className="divide-y divide-line">{mine.slice(0, 4).map(t => <RequestRow key={t.id} t={t} now={now} />)}</div></Card>
        </div>
        <div className="space-y-6"><Announcements /></div>
      </div>
    </div>
  );
}

function AdminDash() {
  const { tickets, actions, toast } = useStore(); const now = useNow(30000);
  const an = useMemo(() => buildAnalytics(tickets), [tickets]);
  const open = tickets.filter(isOpen); const unassigned = open.filter(t => !t.assigneeId);
  const risk = open.filter(t => ['at_risk', 'breached'].includes(slaOf(t, now).state));
  const attention = [...new Map([...risk, ...unassigned].map(t => [t.id, t])).values()].sort((a, b) => a.dueAt - b.dueAt).slice(0, 6);
  const load = AGENTS.map(a => ({ label: a.name, value: open.filter(t => t.assigneeId === a.id).length }));
  const activity = tickets.flatMap(t => t.messages.filter(m => m.type !== 'internal').map(m => ({ ...m, t }))).sort((a, b) => b.at - a.at).slice(0, 7);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-[28px] sm:text-[34px] leading-tight">Operations</h1><p className="mt-1 text-ink-2">{greeting()}, Vikram. {risk.length ? `${risk.length} requests need attention today.` : 'Everything is on track.'}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate('/app/analytics')}>View analytics</Button><Button onClick={() => navigate('/app/tickets')}>Open queue</Button></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Open requests" value={open.length} icon={Inbox} sub="across 6 teams" onClick={() => navigate('/app/tickets')} />
        <StatTile label="Unassigned" value={unassigned.length} icon={Users} tone={unassigned.length ? 'bad' : 'ok'} sub={unassigned.length ? 'Need an owner' : 'All assigned'} onClick={() => navigate('/app/tickets?assignee=none')} />
        <StatTile label="At risk or overdue" value={risk.length} icon={AlertTriangle} tone={risk.length ? 'warn' : 'ok'} sub="Past 75% of target" onClick={() => navigate('/app/tickets?sla=at_risk')} />
        <StatTile label="Resolved on time" value={`${an.slaPct}%`} icon={CheckCircle2} tone="ok" trend={{ text: '+2 pts', good: true }} sub="last 30 days" />
        <StatTile label="Satisfaction" value={`${an.csat}/5`} icon={Star} tone="violet" trend={{ text: '+0.3', good: true }} sub="last 30 days" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card><SectionTitle title="Requests per day" sub="Created and resolved over the last 14 days" />
          <LineChart height={220} labels={an.labels.slice(-14)} series={[{ name: 'Created', color: 'rgb(var(--ac))', data: an.created.slice(-14), area: true }, { name: 'Resolved', color: 'rgb(var(--ink-3))', data: an.resolved.slice(-14), dash: '5 4' }]} /></Card>
        <Card><SectionTitle title="Open work by person" sub="Active requests right now" /><HBars items={load} max={Math.max(4, ...load.map(l => l.value))} /></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card pad={false}><div className="flex items-center justify-between px-5 pt-5"><SectionTitle title="Needs attention" sub="Unassigned or running out of time" /></div>
          <ul className="divide-y divide-line">{attention.map(t => (
            <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
              <Link to={`/app/tickets/${t.id}`} className="min-w-0 flex-1"><p className="truncate text-sm font-medium hover:text-accent-softfg">{t.subject}</p><p className="mt-0.5 flex items-center gap-2 text-xs text-ink-3"><span className="font-mono">{t.id}</span>·<span>{getPerson(t.requesterId).name}</span></p></Link>
              <PriorityPill priority={t.priority} /><SlaChip ticket={t} now={now} />
              <div className="w-40"><Select aria-label={`Assign ${t.id}`} value={t.assigneeId || ''} onChange={(e) => { actions.updateTicket(t.id, { assigneeId: e.target.value, ...(t.status === 'new' ? { status: 'in_review' } : {}) }); toast(`${t.id} assigned to ${getPerson(e.target.value).name}`); }} className="!h-8 text-[13px]"><option value="" disabled>Assign to…</option>{AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></div>
            </li>))}{attention.length === 0 && <EmptyState icon={CheckCircle2} title="Nothing needs attention" body="Every open request has an owner and is inside its target." />}</ul></Card>
        <Card pad={false}><div className="px-5 pt-5"><SectionTitle title="Live activity" /></div>
          <ul className="divide-y divide-line">{activity.map(m => { const p = m.authorId ? getPerson(m.authorId) : null; return (
            <li key={m.id}><Link to={`/app/tickets/${m.t.id}`} className="flex gap-3 px-5 py-3 hover:bg-surface-2">{p ? <Avatar name={p.name} size={28} /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-3 text-ink-3"><Clock className="h-3.5 w-3.5" /></span>}<span className="min-w-0"><span className="block text-[13px]"><b className="font-medium">{p ? p.name : 'System'}</b> <span className="text-ink-2">{m.type === 'system' ? m.body.toLowerCase() : 'replied'}</span> on <span className="font-mono text-xs">{m.t.id}</span></span><span className="text-xs text-ink-3">{timeAgo(m.at)}</span></span></Link></li>); })}</ul></Card>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useStore();
  return user.role === 'admin' ? <AdminDash /> : user.role === 'faculty' ? <FacultyDash /> : <StudentDash />;
}
