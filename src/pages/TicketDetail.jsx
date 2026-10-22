import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Lock, Send, Paperclip, Zap, CheckCircle2, RotateCcw, ShieldAlert, Clock, MapPin, Tag, Radio, UserRound, ChevronDown, Circle, X, BookOpen, Printer, MoreHorizontal } from 'lucide-react';
import { Link, navigate } from '../lib/router';
import { useStore, getPerson, statusMeta, categoryMeta, useNow } from '../store/store';
import { AGENTS, CATEGORIES, PRIORITIES, STATUSES, KB } from '../data/seed';
import { slaOf } from '../lib/sla';
import { cn, fmtDateTime, timeAgo, duration, fmtTime } from '../lib/utils';
import { Button, Badge, StatusPill, PriorityPill, SlaChip, Avatar, Card, Textarea, Select, Popover, MenuItem, Stars, Progress, EmptyState, AttachmentChip, FileDrop, Segmented, Meta } from '../components/ui';
import { NamedIcon } from '../components/ui/icons';
import { suggest } from './NewTicket';

function Stepper({ status }) {
  const step = statusMeta(status).step; const steps = ['Submitted', 'Under review', 'In progress', 'Resolved'];
  return (
    <ol className="grid grid-cols-4" aria-label="Request progress">
      {steps.map((s, i) => (
        <li key={s} className="relative">
          <div className="flex items-center"><span className={cn('z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs', i < step || (i === 3 && step === 3) ? 'bg-accent text-accent-on' : i === step ? 'bg-accent text-accent-on ring-4 ring-accent/25' : 'bg-surface-3 text-ink-3')}>{i < step || (i === 3 && step === 3) ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-2.5 w-2.5 fill-current" />}</span>{i < 3 && <span className={cn('h-0.5 flex-1', i < step ? 'bg-accent' : 'bg-line-strong')} />}</div>
          <p className={cn('mt-2 text-[13px]', i === step ? 'font-semibold text-ink' : 'text-ink-3')}>{s}</p>
        </li>))}
    </ol>
  );
}

function Message({ m, t }) {
  const p = m.authorId ? getPerson(m.authorId) : null; const mine = m.authorId === t.requesterId;
  if (m.type === 'system') return <li className="flex items-center gap-3 py-1 text-xs text-ink-3"><span className="h-px flex-1 bg-line" /><span>{m.body} · {fmtDateTime(m.at)}</span><span className="h-px flex-1 bg-line" /></li>;
  const internal = m.type === 'internal';
  return (
    <li className="flex gap-3.5">
      <Avatar name={p.name} size={36} />
      <div className={cn('min-w-0 flex-1 rounded-xl px-4 py-3.5', internal ? 'bg-warn-soft ring-1 ring-warn/30' : mine ? 'bg-surface shadow-card' : 'bg-accent-soft/60 ring-1 ring-accent/15')}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold">{p.name}</span>
          <span className="text-xs text-ink-3">{p.role === 'agent' ? p.title : p.role === 'admin' ? 'Helpdesk' : p.role === 'faculty' ? 'Faculty' : 'Student'}</span>
          {internal && <Badge tone="warn"><Lock className="h-3 w-3" />Private note</Badge>}
          <span className="ml-auto text-xs text-ink-3" title={fmtDateTime(m.at)}>{timeAgo(m.at)}</span>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{m.body}</p>
        {m.attachments?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{m.attachments.map((a, i) => <AttachmentChip key={i} a={a} />)}</div>}
      </div>
    </li>
  );
}

export function TicketDetail({ id }) {
  const { user, tickets, actions, toast, cannedReplies } = useStore(); const now = useNow(30000);
  const t = tickets.find(x => x.id === id); const staff = user.role === 'admin';
  const [mode, setMode] = useState('public'); const [body, setBody] = useState(''); const [files, setFiles] = useState([]); const [showFiles, setShowFiles] = useState(false);
  const [rating, setRating] = useState(0); const [comment, setComment] = useState('');
  const end = useRef();
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [t?.messages.length]);
  if (!t) return <EmptyState title="We could not find that request" body={`There is no request with the ID ${id}. Check the ID or go back to your list.`} action={<Button onClick={() => navigate('/app/tickets')}>Back to requests</Button>} />;
  if (!staff && t.requesterId !== user.id) return <EmptyState icon={Lock} title="You do not have access to this request" body="Only the person who raised it and the helpdesk team can view it." action={<Button onClick={() => navigate('/app/tickets')}>Back to my requests</Button>} />;

  const requester = getPerson(t.requesterId); const cat = categoryMeta(t.category); const sla = slaOf(t, now); const isReq = t.requesterId === user.id; const done = t.status === 'resolved' || t.status === 'closed';
  const visible = t.messages.filter(m => staff || m.type !== 'internal').sort((a, b) => a.at - b.at);
  const agents = AGENTS.filter(a => a.team === cat.team || true).sort((a, b) => (a.team === cat.team ? -1 : 0) - (b.team === cat.team ? -1 : 0));
  const send = async (resolve) => {
    if (!body.trim() && !files.length) return;
    try {
      await actions.addMessage(t.id, { body: body.trim() || '(attachment)', type: staff ? mode : 'public', attachments: files });
      if (resolve) await actions.updateTicket(t.id, { status: 'resolved' });
      toast({ title: mode === 'internal' ? 'Private note added' : resolve ? 'Sent and marked resolved' : 'Reply sent' });
      setBody(''); setFiles([]); setShowFiles(false);
    } catch (e) {
      // toast shown in store
    }
  };
  const related = suggest(t.subject, 3);

  return (
    <div>
      <Link to="/app/tickets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" />{staff ? 'Request queue' : 'My requests'}</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm text-ink-3">{t.id}</span><StatusPill status={t.status} /><PriorityPill priority={t.priority} /><SlaChip ticket={t} now={now} /></div>
          <h1 className="mt-2 font-display text-[26px] leading-tight sm:text-[32px] max-w-[30ch] sm:max-w-none">{t.subject}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-sm text-ink-2"><span className="inline-flex items-center gap-1.5"><NamedIcon name={cat.icon} className="h-4 w-4" />{cat.name}</span><span>Raised {timeAgo(t.createdAt)} by {isReq ? 'you' : requester.name}</span></p>
        </div>
        <div className="flex items-center gap-2 no-print">
          {isReq && !done && <Button variant="secondary" icon={CheckCircle2} onClick={() => { actions.updateTicket(t.id, { status: 'resolved' }, 'Marked as resolved by requester'); toast('Marked as resolved'); }}>This is fixed</Button>}
          {done && isReq && <Button variant="secondary" icon={RotateCcw} onClick={() => { actions.updateTicket(t.id, { status: 'in_progress' }, 'Reopened by requester'); toast('Request reopened'); }}>Reopen</Button>}
          {staff && !done && <Button icon={CheckCircle2} onClick={() => { actions.updateTicket(t.id, { status: 'resolved' }); toast({ title: `${t.id} resolved`, body: 'The requester has been asked to rate the support.' }); }}>Resolve</Button>}
          {staff && done && <Button variant="secondary" icon={RotateCcw} onClick={() => actions.updateTicket(t.id, { status: 'in_progress' })}>Reopen</Button>}
          <Button variant="ghost" icon={Printer} onClick={() => window.print()} aria-label="Print" className="hidden sm:inline-flex" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-6">
          {!staff && <Card><Stepper status={t.status} />{t.status === 'waiting' && <p className="mt-5 flex items-center gap-2 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn-fg"><Clock className="h-4 w-4" />The team is waiting for your reply. The clock is paused until you respond.</p>}</Card>}
          <ol className="space-y-5" aria-label="Conversation">{visible.map(m => <Message key={m.id} m={m} t={t} />)}<li ref={end} /></ol>

          {done && isReq && (
            <Card className="!bg-accent-soft shadow-none">
              {t.csat ? <div className="flex items-center gap-4"><Stars value={t.csat.rating} /><p className="text-sm text-accent-softfg"><b>Thanks for the feedback.</b>{t.csat.comment && ` “${t.csat.comment}”`}</p></div> : (
                <div><h3 className="font-display text-lg">How did we do?</h3><p className="mt-0.5 text-sm text-ink-2">One tap helps the team improve. Low ratings go to the Helpdesk Lead.</p><div className="mt-3"><Stars value={rating} onChange={setRating} size={30} /></div>
                  {rating > 0 && <div className="mt-4 animate-fade"><Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder={rating <= 3 ? 'What could we have done better?' : 'Anything you would like to add? (optional)'} className="!bg-surface" /><Button className="mt-3" onClick={() => { actions.rateTicket(t.id, rating, comment); toast('Thanks for rating this request'); }}>Submit rating</Button></div>}</div>)}
            </Card>)}

          {(!done || staff || isReq) && (
            <Card pad={false} className="overflow-hidden no-print">
              {staff && <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2"><Segmented size="sm" value={mode} onChange={setMode} label="Reply type" options={[{ value: 'public', label: 'Reply to requester' }, { value: 'internal', label: 'Private note', icon: Lock }]} />
                <Popover width="w-80" trigger={({ toggle }) => <button onClick={toggle} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-accent-softfg hover:bg-accent-soft"><Zap className="h-3.5 w-3.5" />Saved replies</button>}>
                  {(close) => <div className="max-h-72 overflow-y-auto p-1.5">{cannedReplies.map(c => <button key={c.id} onClick={() => { setBody(c.body.replace('{{hours}}', '24')); setMode('public'); close(); }} className="block w-full rounded-md px-2.5 py-2 text-left hover:bg-surface-3"><span className="block text-sm font-medium">{c.title}</span><span className="line-clamp-2 text-xs text-ink-2">{c.body}</span></button>)}</div>}
                </Popover></div>}
              <textarea value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); }} rows={4} aria-label="Write a reply" placeholder={mode === 'internal' ? 'Add a private note. Only the helpdesk team can see this.' : done ? 'Reply to reopen this request' : staff ? 'Write a reply to the requester' : 'Write a reply. Add details or answer the team’s question.'}
                className={cn('w-full resize-none bg-surface px-4 py-3 text-[15px] leading-relaxed placeholder:text-ink-3 focus:outline-none focus:shadow-none', mode === 'internal' && '!bg-warn-soft')} />
              {showFiles && <div className="px-4 pb-3"><FileDrop files={files} onChange={setFiles} /></div>}
              <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2.5">
                <Button variant="ghost" size="sm" icon={Paperclip} onClick={() => setShowFiles(s => !s)}>Attach{files.length ? ` (${files.length})` : ''}</Button>
                <div className="flex items-center gap-2"><span className="hidden text-xs text-ink-3 sm:block">⌘ Enter to send</span>
                  {staff && mode === 'public' && !done && <Button variant="secondary" size="sm" disabled={!body.trim()} onClick={() => send(true)}>Send and resolve</Button>}
                  <Button size="sm" icon={Send} disabled={!body.trim() && !files.length} onClick={() => send(false)}>{mode === 'internal' ? 'Add note' : 'Send reply'}</Button></div>
              </div>
            </Card>)}
        </div>

        <aside className="space-y-4">
          <Card>
            <div className="flex items-center justify-between"><h2 className="font-display text-base">Service target</h2><SlaChip ticket={t} now={now} /></div>
            <Progress value={sla.pct} tone={sla.state === 'breached' ? 'bad' : sla.state === 'at_risk' ? 'warn' : sla.state === 'met' ? 'ok' : 'accent'} className="mt-3" />
            <div className="num mt-2 flex justify-between text-xs text-ink-3"><span>Opened {fmtDateTime(t.createdAt)}</span><span>{sla.done ? 'Closed' : 'Due'} {fmtDateTime(sla.done ? t.resolvedAt : t.dueAt)}</span></div>
          </Card>
          <Card className="space-y-4">
            <h2 className="font-display text-base">Details</h2>
            {staff ? (
              <div className="space-y-3">
                <label className="block text-xs text-ink-3">Status<Select value={t.status} onChange={(e) => actions.updateTicket(t.id, { status: e.target.value })} className="mt-1 text-ink">{STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
                <label className="block text-xs text-ink-3">Priority<Select value={t.priority} onChange={(e) => actions.updateTicket(t.id, { priority: e.target.value })} className="mt-1 text-ink">{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.name} ({p.slaHours}h)</option>)}</Select></label>
                <label className="block text-xs text-ink-3">Assignee<Select value={t.assigneeId || ''} onChange={(e) => { actions.updateTicket(t.id, { assigneeId: e.target.value || null, ...(t.status === 'new' && e.target.value ? { status: 'in_review' } : {}) }); toast(e.target.value ? `Assigned to ${getPerson(e.target.value).name}` : 'Unassigned'); }} className="mt-1 text-ink"><option value="">Unassigned</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name} · {a.team}</option>)}</Select></label>
                <label className="block text-xs text-ink-3">Category<Select value={t.category} onChange={(e) => actions.updateTicket(t.id, { category: e.target.value })} className="mt-1 text-ink">{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></label>
              </div>
            ) : (
              <dl className="space-y-3"><Meta label="Handled by">{t.assigneeId ? <span className="flex items-center gap-2"><Avatar name={getPerson(t.assigneeId).name} size={24} />{getPerson(t.assigneeId).name}<span className="text-ink-3">· {getPerson(t.assigneeId).team}</span></span> : 'Waiting for assignment'}</Meta><Meta label="Team">{cat.team}</Meta></dl>)}
            <dl className="space-y-3 border-t border-line pt-4">
              <Meta label="Requester"><span className="flex items-center gap-2"><Avatar name={requester.name} size={24} />{requester.name}</span><span className="mt-0.5 block text-xs text-ink-3">{requester.title}{requester.dept ? ` · ${requester.dept}` : ''}</span></Meta>
              {t.location && <Meta label="Location"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-ink-3" />{t.location}</span></Meta>}
              <Meta label="First reply">{t.firstResponseAt ? `${duration(t.firstResponseAt - t.createdAt)} after opening` : 'Not yet'}</Meta>
              <Meta label="Channel">{t.channel}</Meta>
              {t.tags.length > 0 && <Meta label="Tags"><span className="flex flex-wrap gap-1.5">{t.tags.map(x => <Badge key={x}>{x}</Badge>)}</span></Meta>}
              {t.csat && <Meta label="Rating"><Stars value={t.csat.rating} size={16} /></Meta>}
            </dl>
          </Card>
          {related.length > 0 && (
            <Card><h2 className="mb-3 font-display text-base">Related articles</h2><ul className="space-y-2.5">{related.map(a => <li key={a.id}><Link to={`/app/knowledge/${a.slug}`} className="flex gap-2 text-sm hover:text-accent-softfg"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />{a.title}</Link></li>)}</ul></Card>)}
        </aside>
      </div>
    </div>
  );
}
