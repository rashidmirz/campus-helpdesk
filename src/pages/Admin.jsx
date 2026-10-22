import { useMemo, useState, useEffect } from 'react';
import { Search, Megaphone, Trash2, Pin, Plus, Mail, Phone, Ticket as TicketIcon } from 'lucide-react';
import { Link, navigate } from '../lib/router';
import { useStore, getPerson } from '../store/store';
import { api } from '../services/api';
import { STUDENTS, FACULTY, DEPARTMENTS, AGENTS } from '../data/seed';
import { cn, timeAgo } from '../lib/utils';
import { Button, Card, PageHeader, Segmented, Input, Badge, Avatar, Drawer, Field, Textarea, Select, StatusPill, Progress, EmptyState, Toggle } from '../components/ui';

export function People() {
  const { tickets } = useStore(); const [tab, setTab] = useState('students'); const [q, setQ] = useState(''); const [dept, setDept] = useState('all'); const [sel, setSel] = useState(null);
  const [remoteRows, setRemoteRows] = useState(null);

  useEffect(() => {
    if (tab === 'depts') return;
    api.getPeople(tab, dept, q)
      .then(setRemoteRows)
      .catch(() => setRemoteRows(null));
  }, [tab, dept, q]);

  const rows = useMemo(() => {
    if (remoteRows) return remoteRows;
    const src = tab === 'students' ? STUDENTS : tab === 'faculty' ? FACULTY : AGENTS;
    return src.filter(p => (dept === 'all' || p.dept === dept) && (!q || `${p.name} ${p.id} ${p.email}`.toLowerCase().includes(q.toLowerCase())));
  }, [remoteRows, tab, q, dept]);
  const tk = (id) => tickets.filter(t => t.requesterId === id);
  const tone = { Active: 'ok', Probation: 'warn', 'On leave': 'neutral' };
  return (
    <div><PageHeader title="People" subtitle="Students, faculty and helpdesk staff. Open a person to see their requests." />
      <div className="mb-5 flex flex-wrap items-center gap-3"><Segmented value={tab} onChange={(v) => { setTab(v); setDept('all'); }} label="Directory" options={[{ value: 'students', label: 'Students', count: STUDENTS.length }, { value: 'faculty', label: 'Faculty', count: FACULTY.length }, { value: 'staff', label: 'Helpdesk team', count: AGENTS.length }, { value: 'depts', label: 'Departments', count: DEPARTMENTS.length }]} />
        {tab !== 'depts' && <><div className="w-full sm:w-64"><Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID or email" aria-label="Search people" className="!h-9" /></div>{tab !== 'staff' && <div className="w-40"><Select value={dept} onChange={(e) => setDept(e.target.value)} className="!h-9 text-[13px]" aria-label="Department"><option value="all">All departments</option>{DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}</Select></div>}</>}</div>
      {tab === 'depts' ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{DEPARTMENTS.map(d => { const n = tickets.filter(t => getPerson(t.requesterId).dept === d.id).length; return <Card key={d.id}><p className="font-display text-lg">{d.id}</p><p className="text-sm text-ink-2">{d.name}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-ink-3">Students</dt><dd className="num font-medium">{d.students}</dd></div><div><dt className="text-xs text-ink-3">Faculty</dt><dd className="num font-medium">{d.faculty}</dd></div></dl><p className="mt-3 border-t border-line pt-3 text-xs text-ink-2">Head: {d.head}</p><p className="text-xs text-ink-3">{n} requests raised</p></Card>; })}</div> : (
        <Card pad={false} className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b border-line bg-surface-2 text-left text-xs font-medium text-ink-3"><th className="px-5 py-2.5">Name</th><th>{tab === 'students' ? 'Course' : tab === 'faculty' ? 'Designation' : 'Team'}</th>{tab === 'students' && <><th>Attendance</th><th>Fees</th></>}<th>Status</th><th className="pr-5 text-right">Requests</th></tr></thead>
          <tbody>{rows.map(p => <tr key={p.id} onClick={() => setSel(p)} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2"><td className="px-5 row-pad"><span className="flex items-center gap-3"><Avatar name={p.name} size={32} /><span><span className="block font-medium">{p.name}</span><span className="block font-mono text-xs text-ink-3">{p.id}</span></span></span></td><td className="text-ink-2">{tab === 'students' ? `${p.course} · ${p.sem}` : tab === 'faculty' ? p.designation : p.team}</td>{tab === 'students' && <><td><span className="num inline-flex w-28 items-center gap-2"><Progress value={p.attendance / 100} tone={p.attendance < 80 ? 'warn' : 'ok'} className="w-14" />{p.attendance}%</span></td><td><Badge tone={p.fees === 'Paid' ? 'ok' : p.fees === 'Pending' ? 'bad' : 'warn'}>{p.fees}</Badge></td></>}<td><Badge tone={tone[p.status || 'Active']} dot>{p.status || 'Active'}</Badge></td><td className="num pr-5 text-right">{tab === 'staff' ? tickets.filter(t => t.assigneeId === p.id).length : tk(p.id).length}</td></tr>)}</tbody></table></div>
          {rows.length === 0 && <EmptyState title="No one matches" body="Try a different name or department." />}</Card>)}
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name} subtitle={sel && (sel.course || sel.designation || sel.title)}>
        {sel && <div className="space-y-6"><div className="flex items-center gap-4"><Avatar name={sel.name} size={56} /><div><p className="font-mono text-xs text-ink-3">{sel.id}</p><p className="text-sm text-ink-2">{sel.dept ? `${sel.dept} department` : sel.team}</p></div></div>
          <dl className="space-y-3 text-sm"><div className="flex items-center gap-3"><Mail className="h-4 w-4 text-ink-3" />{sel.email}</div>{sel.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-ink-3" />{sel.phone}</div>}{sel.hostel && <div className="flex items-center gap-3"><span className="w-4 text-center text-ink-3">⌂</span>{sel.hostel}</div>}</dl>
          {sel.cgpa && <div className="grid grid-cols-2 gap-3"><Card className="!p-4"><p className="text-xs text-ink-3">CGPA</p><p className="num font-display text-2xl">{sel.cgpa}</p></Card><Card className="!p-4"><p className="text-xs text-ink-3">Attendance</p><p className="num font-display text-2xl">{sel.attendance}%</p></Card></div>}
          <div><h3 className="mb-2 font-display text-base">Requests</h3>{(sel.id.startsWith('AGT') ? tickets.filter(t => t.assigneeId === sel.id) : tk(sel.id)).slice(0, 6).map(t => <Link key={t.id} to={`/app/tickets/${t.id}`} className="flex items-center gap-3 border-b border-line py-2.5 text-sm last:border-0 hover:text-accent-softfg"><span className="min-w-0 flex-1 truncate">{t.subject}</span><StatusPill status={t.status} /></Link>)}{(sel.id.startsWith('AGT') ? tickets.filter(t => t.assigneeId === sel.id) : tk(sel.id)).length === 0 && <p className="text-sm text-ink-3">No requests yet.</p>}</div></div>}
      </Drawer>
    </div>
  );
}

export function Announcements() {
  const { announcements, actions, toast } = useStore(); const [f, setF] = useState({ title: '', body: '', tone: 'info', pinned: false }); const [err, setErr] = useState('');
  const send = () => { if (f.title.trim().length < 5 || f.body.trim().length < 10) return setErr('Add a title (5+ characters) and a message (10+ characters).'); setErr(''); actions.postAnnouncement({ ...f, title: f.title.trim(), body: f.body.trim() }); setF({ title: '', body: '', tone: 'info', pinned: false }); toast({ title: 'Announcement published', body: 'It now appears on every dashboard.' }); };
  return (
    <div><PageHeader title="Announcements" subtitle="Publish campus-wide notices. They appear on every student and faculty overview." />
      <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
        <Card className="space-y-4"><h2 className="font-display text-base">New announcement</h2>
          <Field label="Title" htmlFor="at"><Input id="at" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Library closed on Sunday" /></Field>
          <Field label="Message" htmlFor="am" error={err}><Textarea id="am" rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
          <Field label="Type" htmlFor="ty"><Select id="ty" value={f.tone} onChange={(e) => setF({ ...f, tone: e.target.value })}><option value="info">Information</option><option value="warn">Warning or disruption</option><option value="ok">Good news</option></Select></Field>
          <Toggle label="Pin to the top" checked={f.pinned} onChange={(v) => setF({ ...f, pinned: v })} /><Button icon={Megaphone} onClick={send} className="w-full">Publish</Button></Card>
        <div className="space-y-3">{announcements.map(a => <Card key={a.id} className="flex items-start gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{a.title}</h3>{a.pinned && <Badge tone="accent"><Pin className="h-3 w-3" />Pinned</Badge>}<Badge tone={a.tone}>{{ info: 'Information', warn: 'Disruption', ok: 'Good news' }[a.tone]}</Badge></div><p className="mt-1.5 text-sm text-ink-2">{a.body}</p><p className="mt-2 text-xs text-ink-3">{a.by} · {timeAgo(a.at)}</p></div><button aria-label={`Delete ${a.title}`} onClick={() => { actions.deleteAnnouncement(a.id); toast({ title: 'Announcement removed', tone: 'info' }); }} className="rounded p-1.5 text-ink-3 hover:bg-bad-soft hover:text-bad"><Trash2 className="h-4 w-4" /></button></Card>)}</div></div></div>
  );
}
