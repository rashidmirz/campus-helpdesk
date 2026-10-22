import { useMemo, useState, useEffect } from 'react';
import { Download, CalendarClock, MapPin, Armchair, Clock, FileText, CheckCircle2, CreditCard, Smartphone, Landmark, Receipt, Plus, Search, Package, HandHeart, ArrowRight, Users, Check, AlertTriangle, ShieldCheck, Printer } from 'lucide-react';
import { navigate, Link } from '../lib/router';
import { useStore, getPerson } from '../store/store';
import { api } from '../services/api';
import { EXAMS, EXAM_RESOURCES, DOCUMENTS, EVENTS, STUDENTS, CATEGORIES } from '../data/seed';
import { cn, DAY, fmtDate, money, download, timeAgo } from '../lib/utils';
import { Button, Card, PageHeader, Tabs, Badge, Modal, Field, Input, Textarea, Select, Segmented, Progress, EmptyState, Checkbox, StatusPill, Avatar, StatTile, SectionTitle } from '../components/ui';
import { NamedIcon } from '../components/ui/icons';
import { HBars } from '../components/charts';

/* ── Exams ───────────────────────────────────────────────────────────── */
export function Exams() {
  const { user, toast } = useStore(); const [tab, setTab] = useState('timetable'); const faculty = user.role === 'faculty';
  const [remoteExams, setRemoteExams] = useState(null);

  useEffect(() => {
    api.getExams().then(setRemoteExams).catch(() => {});
  }, []);

  const examList = remoteExams && remoteExams.length ? remoteExams : EXAMS;
  const ticket = (e) => { download(`hall-ticket-${e ? e.code : 'all'}.html`, `<h1>Silver Oak University: Hall Ticket</h1><p>${user.name} · ${user.idValue}</p><ul>${(e ? [e] : examList).map(x => `<li>${x.code} ${x.name}: ${fmtDate(Date.now() + x.in * DAY)}, ${x.time}, ${x.hall}, seat ${x.seat}</li>`).join('')}</ul>`, 'text/html'); toast({ title: 'Hall ticket downloaded', body: 'Carry a printed copy and your ID card.' }); };
  const duties = [{ date: 10, hall: 'Hall A-04, Academic Block', role: 'Chief invigilator', slot: 'Cloud Computing · 10:00 AM' }, { date: 13, hall: 'Hall B-11, Academic Block', role: 'Invigilator', slot: 'Software Architecture · 10:00 AM' }];
  return (
    <div>
      <PageHeader title={faculty ? 'Exam duties' : 'Exams'} subtitle={faculty ? 'Your invigilation schedule for mid-semester exams.' : 'Mid-semester timetable, seat allocation and study material.'} actions={!faculty && <Button icon={Download} onClick={() => ticket()}>Download hall ticket</Button>} />
      {faculty ? (
        <div className="grid gap-4 md:grid-cols-2">{duties.map((d, i) => <Card key={i} className="flex gap-4"><div className="w-14 shrink-0 rounded-lg bg-accent-soft py-2 text-center text-accent-softfg"><p className="num font-display text-2xl leading-none">{new Date(Date.now() + d.date * DAY).getDate()}</p><p className="text-xs">{new Date(Date.now() + d.date * DAY).toLocaleDateString('en-IN', { month: 'short' })}</p></div><div><p className="font-medium">{d.slot}</p><p className="mt-0.5 text-sm text-ink-2">{d.hall}</p><Badge tone="violet" className="mt-2">{d.role}</Badge></div></Card>)}<Card className="md:col-span-2 !bg-info-soft shadow-none"><p className="text-sm text-info-fg">Report to the Exam Cell counter 30 minutes before each session to collect answer booklets. Raise an Exams request if you need to swap a duty.</p></Card></div>
      ) : (<>
        <Tabs value={tab} onChange={setTab} className="mb-6" tabs={[{ value: 'timetable', label: 'Timetable', count: examList.length }, { value: 'resources', label: 'Study material', count: EXAM_RESOURCES.length }, { value: 'rules', label: 'Exam rules' }]} />
        {tab === 'timetable' && (
          <div className="space-y-3">{examList.map(e => { const d = new Date(Date.now() + e.in * DAY); return (
            <Card key={e.code} className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="w-16 shrink-0 text-center"><p className="text-xs text-ink-3">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</p><p className="num font-display text-3xl leading-none">{d.getDate()}</p><p className="text-xs text-ink-2">{d.toLocaleDateString('en-IN', { month: 'short' })}</p></div>
              <div className="min-w-[200px] flex-1"><p className="font-medium">{e.name}</p><p className="mt-0.5 text-sm text-ink-2"><span className="font-mono">{e.code}</span> · {e.credits} credits · {e.kind}</p></div>
              <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><div><dt className="flex items-center gap-1 text-xs text-ink-3"><Clock className="h-3 w-3" />Time</dt><dd>{e.time}</dd></div><div><dt className="flex items-center gap-1 text-xs text-ink-3"><MapPin className="h-3 w-3" />Hall</dt><dd>{e.hall}</dd></div><div><dt className="flex items-center gap-1 text-xs text-ink-3"><Armchair className="h-3 w-3" />Seat</dt><dd className="font-mono">{e.seat}</dd></div></dl>
              <div className="flex items-center gap-2">{e.in <= 10 && <Badge tone="warn" dot>In {e.in} days</Badge>}<Button variant="secondary" size="sm" icon={Download} onClick={() => ticket(e)}>Hall ticket</Button></div>
            </Card>); })}
            <p className="pt-2 text-sm text-ink-2">Something wrong with your hall or seat? <Link to="/app/tickets/new?cat=exam" className="font-medium text-accent-softfg underline underline-offset-2">Raise an Exams request</Link>. It is marked urgent automatically within 7 days of an exam.</p></div>)}
        {tab === 'resources' && <div className="grid gap-4 md:grid-cols-2">{EXAM_RESOURCES.map(r => <Card key={r.id} className="flex items-center gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-3 text-ink-2"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.title}</p><p className="text-xs text-ink-3">{r.kind} · PDF · {r.size}</p></div><Button variant="ghost" size="sm" icon={Download} aria-label={`Download ${r.title}`} onClick={() => toast('Download started: ' + r.title)} /></Card>)}</div>}
        {tab === 'rules' && <Card className="max-w-2xl"><ul className="space-y-4 text-[15px] text-ink-2">{['Arrive 20 minutes before the start. Entry closes 15 minutes after.', 'Carry your ID card and a printed hall ticket. Phones and smart watches are not allowed in the hall.', 'Only the Casio fx-991 series calculators are permitted. Keep them free of notes.', 'Use only blue or black pens. Rough work goes on the last pages of the booklet.', 'Medical emergencies: tell the invigilator. The Health Centre is on call.'].map((r, i) => <li key={i} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />{r}</li>)}</ul></Card>}
      </>)}
    </div>
  );
}

/* ── Fees ────────────────────────────────────────────────────────────── */
function PayModal({ open, onClose, ids }) {
  const { fees, actions, toast } = useStore(); const [m, setM] = useState('upi'); const [busy, setBusy] = useState(false); const [rc, setRc] = useState(null);
  const items = fees.filter(f => ids.includes(f.id)); const total = items.reduce((a, f) => a + f.amount, 0);
  const close = () => { setRc(null); setBusy(false); onClose(); };
  const pay = () => { setBusy(true); setTimeout(() => { setRc(actions.payFees(ids, m)); setBusy(false); }, 1400); };
  const methods = [['upi', 'UPI', Smartphone, 'Pay with any UPI app'], ['card', 'Card', CreditCard, 'Debit or credit card'], ['net', 'Net banking', Landmark, '40+ banks']];
  return (
    <Modal open={open} onClose={close} size="sm" title={rc ? 'Payment received' : 'Pay fees'} footer={rc ? <><Button variant="secondary" icon={Download} onClick={() => { download(`${rc.id}.txt`, `Silver Oak University\nReceipt ${rc.id}\n${rc.items.join('\n')}\nTotal ${money(rc.total)} via ${rc.method.toUpperCase()}`); toast('Receipt downloaded'); }}>Receipt</Button><Button onClick={close}>Done</Button></> : <><Button variant="ghost" onClick={close}>Cancel</Button><Button loading={busy} onClick={pay}>Pay {money(total)}</Button></>}>
      {rc ? <div className="py-4 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok-soft text-ok-fg"><CheckCircle2 className="h-8 w-8" /></span><p className="num mt-4 font-display text-3xl">{money(rc.total)}</p><p className="mt-1 text-sm text-ink-2">Receipt <span className="font-mono">{rc.id}</span> is saved under Payments.</p></div> : (
        <div><ul className="mb-5 divide-y divide-line rounded-lg bg-surface-2 px-4">{items.map(i => <li key={i.id} className="flex justify-between py-2.5 text-sm"><span>{i.name}</span><span className="num font-medium">{money(i.amount)}</span></li>)}</ul>
          <div role="radiogroup" className="space-y-2">{methods.map(([v, l, I, d]) => <button key={v} role="radio" aria-checked={m === v} onClick={() => setM(v)} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left', m === v ? 'border-accent bg-accent-soft' : 'border-line-strong hover:bg-surface-2')}><I className="h-5 w-5 text-ink-2" /><span><span className="block text-sm font-medium">{l}</span><span className="text-xs text-ink-2">{d}</span></span>{m === v && <Check className="ml-auto h-4 w-4 text-accent" />}</button>)}</div>
          <p className="mt-4 flex items-center gap-2 text-xs text-ink-3"><ShieldCheck className="h-4 w-4" />Demo only. No real payment is made.</p></div>)}
    </Modal>
  );
}
export function Fees() {
  const { user, fees, receipts } = useStore(); const [sel, setSel] = useState([]); const [pay, setPay] = useState(false);
  if (user.role === 'admin') return <FeeAdmin />;
  const due = fees.filter(f => f.status === 'due'); const total = fees.reduce((a, f) => a + f.amount, 0); const paid = fees.filter(f => f.status === 'paid').reduce((a, f) => a + f.amount, 0);
  const selTotal = fees.filter(f => sel.includes(f.id)).reduce((a, f) => a + f.amount, 0);
  return (
    <div>
      <PageHeader title="Fees" subtitle="Semester 6 · academic year 2025–26" actions={due.length > 0 && <Button icon={CreditCard} onClick={() => { setSel(due.map(f => f.id)); setPay(true); }}>Pay all dues ({money(due.reduce((a, f) => a + f.amount, 0))})</Button>} />
      <div className="grid gap-4 sm:grid-cols-3"><StatTile label="Total this semester" value={money(total)} icon={Receipt} sub={`${fees.length} items`} /><StatTile label="Paid" value={money(paid)} icon={CheckCircle2} tone="ok" sub={`${Math.round(paid / total * 100)}% of total`}><div className="mt-3"><Progress value={paid / total} tone="ok" /></div></StatTile><StatTile label="Due" value={money(total - paid)} icon={AlertTriangle} tone={due.length ? 'warn' : 'ok'} sub={due.length ? 'Next deadline 25 Oct' : 'Nothing due'} /></div>
      <Card pad={false} className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5"><SectionTitle title="Fee items" />{sel.length > 0 && <Button size="sm" onClick={() => setPay(true)}>Pay {money(selTotal)}</Button>}</div>
        <ul className="divide-y divide-line">{fees.map(f => (
          <li key={f.id} className="flex items-center gap-4 px-5 row-pad">{f.status === 'due' ? <Checkbox checked={sel.includes(f.id)} onChange={(v) => setSel(v ? [...sel, f.id] : sel.filter(x => x !== f.id))} label={`Select ${f.name}`} /> : <CheckCircle2 className="h-[18px] w-[18px] text-ok" />}
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{f.name}</p><p className="text-xs text-ink-3">{f.status === 'paid' ? `Paid ${f.paidOn}` : `Due ${f.due}`}</p></div><span className="num text-sm font-medium">{money(f.amount)}</span><Badge tone={f.status === 'paid' ? 'ok' : 'warn'} dot>{f.status === 'paid' ? 'Paid' : 'Due'}</Badge></li>))}</ul>
      </Card>
      {receipts.length > 0 && <Card pad={false} className="mt-6"><div className="px-5 pt-5"><SectionTitle title="Payments made in this session" /></div><ul className="divide-y divide-line">{receipts.map(r => <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm"><span><span className="font-mono">{r.id}</span> · {r.items.join(', ')}</span><span className="num font-medium">{money(r.total)}</span></li>)}</ul></Card>}
      <p className="mt-4 text-sm text-ink-2">Paid but still showing as due? <Link to="/app/tickets/new?cat=fees" className="font-medium text-accent-softfg underline underline-offset-2">Raise a Fees request</Link> with your UTR number.</p>
      <PayModal open={pay} onClose={() => { setPay(false); setSel([]); }} ids={sel.length ? sel : due.map(f => f.id)} />
    </div>
  );
}
function FeeAdmin() {
  const rows = STUDENTS.filter(s => s.fees !== 'Paid');
  return (
    <div><PageHeader title="Fee collection" subtitle="Collection status for the current semester. Sample figures." />
      <div className="grid gap-4 sm:grid-cols-3"><StatTile label="Collected" value="₹31.4 cr" icon={CheckCircle2} tone="ok" sub="of ₹34.2 cr expected"><div className="mt-3"><Progress value={.918} tone="ok" /></div></StatTile><StatTile label="Pending" value="₹2.8 cr" icon={AlertTriangle} tone="warn" sub="from 142 students" /><StatTile label="Scholarship in transit" value="₹46 L" icon={Landmark} tone="violet" sub="38 students" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><Card><SectionTitle title="Pending by department" /><HBars items={[{ label: 'Mechanical', value: 38 }, { label: 'Computer Science', value: 31 }, { label: 'Civil', value: 24 }, { label: 'Business Admin', value: 19 }, { label: 'Pharmacy', value: 14 }, { label: 'Others', value: 16 }]} /></Card>
        <Card pad={false}><div className="px-5 pt-5"><SectionTitle title="Follow up" sub="Students with partial or pending fees" /></div><ul className="divide-y divide-line">{rows.map(s => <li key={s.id} className="flex items-center gap-3 px-5 py-3"><Avatar name={s.name} size={32} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-ink-3">{s.course} · {s.sem} sem</p></div><Badge tone={s.fees === 'Pending' ? 'bad' : 'warn'} dot>{s.fees}</Badge></li>)}</ul></Card></div></div>
  );
}

/* ── Documents ───────────────────────────────────────────────────────── */
export function Documents() {
  const { user, tickets, actions, toast } = useStore(); const [doc, setDoc] = useState(null); const [note, setNote] = useState(''); const [copies, setCopies] = useState('1');
  const mine = tickets.filter(t => t.requesterId === user.id && t.category === 'cert');
  const submit = () => {
    const t = actions.createTicket({ subject: `Request: ${doc.name}`, category: 'cert', priority: 'low', description: `${doc.name}, ${copies} cop${copies === '1' ? 'y' : 'ies'}.\n${note || 'No extra details.'}` });
    setDoc(null); setNote(''); setCopies('1'); toast({ title: `${doc.name} requested`, body: `Tracking as ${t.id}. Ready in ${doc.tat}.`, action: { label: 'View request', run: () => navigate(`/app/tickets/${t.id}`) } });
  };
  return (
    <div>
      <PageHeader title="Documents" subtitle="Request official certificates and letters. Each request is tracked like any other, with a due date." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{DOCUMENTS.map(d => (
        <Card key={d.id} className="flex flex-col"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-softfg"><NamedIcon name={d.icon} className="h-5 w-5" /></span><div><h3 className="font-medium">{d.name}</h3><p className="mt-0.5 text-[13px] text-ink-2">{d.desc}</p></div></div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-ink-3">Ready in</dt><dd>{d.tat}</dd></div><div><dt className="text-xs text-ink-3">Fee</dt><dd className="num">{d.fee ? money(d.fee) : 'Free'}</dd></div></dl>
          <Button variant="secondary" className="mt-5 w-full" onClick={() => setDoc(d)}>Request</Button></Card>))}</div>
      {mine.length > 0 && <Card pad={false} className="mt-8"><div className="px-5 pt-5"><SectionTitle title="Your document requests" /></div><ul className="divide-y divide-line">{mine.map(t => <li key={t.id}><Link to={`/app/tickets/${t.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-2"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{t.subject}</span><span className="text-xs text-ink-3"><span className="font-mono">{t.id}</span> · {timeAgo(t.createdAt)}</span></span><StatusPill status={t.status} /></Link></li>)}</ul></Card>}
      <Modal open={!!doc} onClose={() => setDoc(null)} title={doc ? `Request ${doc.name.toLowerCase()}` : ''} description={doc && `Ready in ${doc.tat}. ${doc.fee ? `Fee ${money(doc.fee)} is added to your dues.` : 'No fee.'}`} footer={<><Button variant="ghost" onClick={() => setDoc(null)}>Cancel</Button><Button onClick={submit}>Send request</Button></>}>
        {doc && <div className="space-y-4"><Field label="Copies" htmlFor="cp"><Select id="cp" value={copies} onChange={(e) => setCopies(e.target.value)}>{['1', '2', '3'].map(n => <option key={n}>{n}</option>)}</Select></Field><Field label="What we need from you" hint={doc.needs.join(' · ')} htmlFor="nt"><Textarea id="nt" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Addressee, purpose or delivery details" /></Field></div>}
      </Modal>
    </div>
  );
}

/* ── Lost & Found ────────────────────────────────────────────────────── */
const LF_CATS = ['Electronics', 'Cards & ID', 'Books & notes', 'Stationery', 'Keys', 'Valuables', 'Personal items'];
export function LostFound() {
  const { user, lostFound, actions, toast } = useStore(); const [type, setType] = useState('all'); const [q, setQ] = useState(''); const [cat, setCat] = useState('all'); const [rep, setRep] = useState(false); const [claim, setClaim] = useState(null);
  const [f, setF] = useState({ type: 'lost', title: '', cat: LF_CATS[0], place: '', desc: '' }); const [err, setErr] = useState({});
  const list = useMemo(() => lostFound.filter(i => (type === 'all' || i.type === type) && (cat === 'all' || i.cat === cat) && (!q || `${i.title} ${i.place} ${i.desc}`.toLowerCase().includes(q.toLowerCase()))), [lostFound, type, cat, q]);
  const submit = () => { const e = {}; if (f.title.trim().length < 4) e.title = 'Describe the item in a few words.'; if (!f.place.trim()) e.place = 'Where did you lose or find it?'; setErr(e); if (Object.keys(e).length) return; actions.reportLF({ ...f, title: f.title.trim() }); setRep(false); setF({ type: 'lost', title: '', cat: LF_CATS[0], place: '', desc: '' }); toast({ title: f.type === 'lost' ? 'Lost item reported' : 'Thanks for reporting the found item', body: 'We will notify you if there is a match.' }); };
  return (
    <div>
      <PageHeader title="Lost & Found" subtitle="Report something you lost or found. Matches are suggested by place and category." actions={user.role !== 'admin' && <Button icon={Plus} onClick={() => setRep(true)}>Report an item</Button>} />
      <div className="mb-5 flex flex-wrap items-center gap-3"><Segmented value={type} onChange={setType} label="Type" options={[{ value: 'all', label: 'All', count: lostFound.length }, { value: 'lost', label: 'Lost', count: lostFound.filter(i => i.type === 'lost').length }, { value: 'found', label: 'Found', count: lostFound.filter(i => i.type === 'found').length }]} />
        <div className="w-full sm:w-64"><Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items or places" aria-label="Search" className="!h-9" /></div>
        <div className="w-44"><Select value={cat} onChange={(e) => setCat(e.target.value)} className="!h-9 text-[13px]" aria-label="Category"><option value="all">All categories</option>{LF_CATS.map(c => <option key={c}>{c}</option>)}</Select></div></div>
      {list.length === 0 ? <Card><EmptyState icon={Package} title="No items match" body="Try a different category or clear the search." /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map(i => { const by = getPerson(i.by); const mine = i.by === user.id; return (
          <Card key={i.id} className="flex flex-col"><div className="flex items-center justify-between"><Badge tone={i.type === 'lost' ? 'bad' : 'ok'} dot>{i.type === 'lost' ? 'Lost' : 'Found'}</Badge><Badge tone={i.status === 'Claimed' ? 'neutral' : 'info'}>{i.status === 'Claimed' ? 'Returned' : 'Open'}</Badge></div>
            <h3 className="mt-3 font-medium leading-snug">{i.title}</h3><p className="mt-1.5 line-clamp-2 text-[13px] text-ink-2">{i.desc}</p>
            <dl className="mt-4 space-y-1.5 text-[13px] text-ink-2"><div className="flex gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" />{i.place}</div><div className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" />{i.ago === 0 ? 'Today' : `${i.ago} day${i.ago > 1 ? 's' : ''} ago`} · {i.cat}</div></dl>
            {i.reward && <Badge tone="warn" className="mt-3 w-fit"><HandHeart className="h-3 w-3" />Reward offered</Badge>}
            <div className="mt-auto flex items-center gap-2 pt-5"><Avatar name={by.name} size={24} /><span className="min-w-0 flex-1 truncate text-xs text-ink-3">{mine ? 'You' : by.name}</span>
              {i.status === 'Open' && user.role !== 'admin' && !mine && <Button size="sm" variant="secondary" onClick={() => setClaim(i)}>{i.type === 'found' ? 'This is mine' : 'I found this'}</Button>}
              {i.status === 'Open' && (mine || user.role === 'admin') && <Button size="sm" variant="ghost" onClick={() => { actions.claimLF(i.id); toast('Marked as returned'); }}>Mark returned</Button>}</div></Card>); })}</div>)}
      <Modal open={rep} onClose={() => setRep(false)} title="Report an item" footer={<><Button variant="ghost" onClick={() => setRep(false)}>Cancel</Button><Button onClick={submit}>Submit report</Button></>}>
        <div className="space-y-4"><Segmented className="w-full [&>button]:flex-1" value={f.type} onChange={(v) => setF({ ...f, type: v })} label="Type" options={[{ value: 'lost', label: 'I lost something' }, { value: 'found', label: 'I found something' }]} />
          <Field label="What is it?" required error={err.title} htmlFor="lt"><Input id="lt" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Black Casio calculator" /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Category" htmlFor="lc"><Select id="lc" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{LF_CATS.map(c => <option key={c}>{c}</option>)}</Select></Field><Field label="Where?" required error={err.place} htmlFor="lp"><Input id="lp" value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} placeholder="Library, 2nd floor" /></Field></div>
          <Field label="Identifying details" htmlFor="ld" hint="Colour, stickers, marks. Do not share anything only the owner should know."><Textarea id="ld" rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Field></div>
      </Modal>
      <Modal open={!!claim} onClose={() => setClaim(null)} size="sm" title={claim?.type === 'found' ? 'Claim this item' : 'Tell the owner'} description={claim?.title} footer={<><Button variant="ghost" onClick={() => setClaim(null)}>Cancel</Button><Button onClick={() => { toast({ title: 'Message sent', body: claim.type === 'found' ? 'Bring your ID to the security desk to collect it.' : 'The owner has been notified.' }); setClaim(null); }}>Send</Button></>}>
        <p className="text-sm text-ink-2">{claim?.type === 'found' ? 'Describe one detail only the owner would know, such as a mark or what is inside. Security verifies this before handing it over.' : 'Tell the owner where the item is now. We will share your name but not your phone number.'}</p><Textarea className="mt-4" rows={3} aria-label="Message" /></Modal>
    </div>
  );
}

/* ── Events ──────────────────────────────────────────────────────────── */
export function Events() {
  const { user, eventRegs, actions, toast } = useStore(); const [tag, setTag] = useState('All'); const tags = ['All', ...new Set(EVENTS.map(e => e.tag))];
  const list = EVENTS.filter(e => tag === 'All' || e.tag === tag).sort((a, b) => a.in - b.in);
  return (
    <div><PageHeader title="Events" subtitle="Talks, fests, sports and career fairs on campus." />
      <div className="mb-5 flex flex-wrap gap-2">{tags.map(t => <button key={t} onClick={() => setTag(t)} aria-pressed={tag === t} className={cn('h-9 rounded-full px-4 text-[13px] font-medium transition', tag === t ? 'bg-accent-soft text-accent-softfg ring-1 ring-accent' : 'bg-surface text-ink-2 shadow-card hover:text-ink')}>{t}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-2">{list.map(e => { const d = new Date(Date.now() + e.in * DAY); const reg = eventRegs.includes(e.id); const count = e.registered + (reg && e.id !== 'ev2' ? 1 : 0); const full = count >= e.capacity; return (
        <Card key={e.id} className="flex gap-5"><div className="h-fit w-16 shrink-0 overflow-hidden rounded-xl bg-surface-3 text-center"><p className="bg-accent py-1 text-[11px] font-medium text-accent-on">{d.toLocaleDateString('en-IN', { month: 'short' })}</p><p className="num py-2 font-display text-3xl leading-none">{d.getDate()}</p></div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Badge tone="accent">{e.tag}</Badge>{e.in <= 7 && <Badge tone="warn">This week</Badge>}</div><h3 className="mt-2 font-display text-lg leading-snug">{e.title}</h3><p className="mt-1 text-sm text-ink-2">{e.desc}</p><p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2"><span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{e.time}</span><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{e.venue}</span></p>
            <div className="mt-4"><div className="num mb-1.5 flex justify-between text-xs text-ink-3"><span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{count.toLocaleString('en-IN')} going</span><span>{Math.max(0, e.capacity - count).toLocaleString('en-IN')} spots left</span></div><Progress value={count / e.capacity} tone={count / e.capacity > .85 ? 'warn' : 'accent'} /></div>
            {user.role !== 'admin' && <Button className="mt-4" variant={reg ? 'soft' : 'primary'} icon={reg ? Check : undefined} disabled={full && !reg} onClick={() => { actions.toggleEvent(e.id); toast(reg ? { title: 'Registration cancelled', tone: 'info' } : { title: `You are going to ${e.title}`, body: 'Added to Coming up on your overview.' }); }}>{reg ? 'You are registered' : full ? 'Event is full' : 'Register'}</Button>}</div></Card>); })}</div></div>
  );
}
