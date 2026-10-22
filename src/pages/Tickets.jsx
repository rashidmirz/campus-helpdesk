import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, SlidersHorizontal, LayoutList, Columns3, Download, ChevronDown, X, Bookmark, Check, Inbox, UserPlus, ArrowUpDown, MessageSquare, Paperclip } from 'lucide-react';
import { Link, navigate, useRoute } from '../lib/router';
import { useStore, getPerson, statusMeta, categoryMeta, useNow } from '../store/store';
import { CATEGORIES, PRIORITIES, STATUSES, AGENTS } from '../data/seed';
import { isOpen, slaOf } from '../lib/sla';
import { cn, timeAgo, download, fmtDate } from '../lib/utils';
import { Button, Badge, StatusPill, PriorityPill, SlaChip, Avatar, Card, PageHeader, Input, Tabs, Segmented, Popover, MenuItem, Checkbox, EmptyState, Select } from '../components/ui';
import { NamedIcon } from '../components/ui/icons';

function FilterMenu({ label, options, value, onChange }) {
  const sel = value.length;
  return (
    <Popover align="left" width="w-60" trigger={({ toggle }) => (
      <button onClick={toggle} className={cn('inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium transition', sel ? 'border-accent bg-accent-soft text-accent-softfg' : 'border-line-strong bg-surface text-ink-2 hover:bg-surface-3')}>
        {label}{sel > 0 && <span className="num rounded-full bg-accent px-1.5 text-[11px] text-accent-on">{sel}</span>}<ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>)}>
      <div className="max-h-72 overflow-y-auto p-1.5">
        {options.map(o => <MenuItem key={o.value} active={value.includes(o.value)} onClick={() => onChange(value.includes(o.value) ? value.filter(v => v !== o.value) : [...value, o.value])}>{o.label}</MenuItem>)}
        {sel > 0 && <button onClick={() => onChange([])} className="mt-1 w-full rounded-md px-2.5 py-2 text-left text-xs font-medium text-ink-2 hover:bg-surface-3">Clear {label.toLowerCase()}</button>}
      </div>
    </Popover>
  );
}

const SORTS = { updated: ['Recently updated', (a, b) => b.updatedAt - a.updatedAt], created: ['Newest first', (a, b) => b.createdAt - a.createdAt], due: ['Due soonest', (a, b) => (a.resolvedAt ? 1 : 0) - (b.resolvedAt ? 1 : 0) || a.dueAt - b.dueAt], priority: ['Highest priority', (a, b) => PRIORITIES.findIndex(p => p.id === b.priority) - PRIORITIES.findIndex(p => p.id === a.priority)] };

function Row({ t, now, staff, selected, onSelect }) {
  const who = staff ? getPerson(t.requesterId) : (t.assigneeId ? getPerson(t.assigneeId) : null);
  const cat = categoryMeta(t.category); const replies = t.messages.filter(m => m.type === 'public').length - 1;
  return (
    <div onClick={() => navigate(`/app/tickets/${t.id}`)} className={cn('group grid cursor-pointer items-center gap-x-4 gap-y-2 border-b border-line px-4 transition hover:bg-surface-2 row-pad', staff ? 'grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_minmax(0,1fr)_120px_90px_130px_140px_140px_72px]' : 'grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1fr)_120px_90px_130px_150px_90px]', selected && 'bg-accent-soft/60')}>
      {staff && <Checkbox checked={selected} onChange={onSelect} label={`Select ${t.id}`} />}
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-2 sm:flex"><NamedIcon name={cat.icon} className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink group-hover:text-accent-softfg">{t.subject}</p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-3"><span className="font-mono">{t.id}</span><span>·</span><span className="truncate">{cat.name}</span>{replies > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{replies}</span>}</p>
        </div>
      </div>
      <div className="hidden lg:block"><StatusPill status={t.status} /></div>
      <div className="hidden lg:block"><PriorityPill priority={t.priority} /></div>
      <div className="hidden lg:block"><SlaChip ticket={t} now={now} /></div>
      {staff && <div className="hidden min-w-0 items-center gap-2 lg:flex"><Avatar name={getPerson(t.requesterId).name} size={24} /><span className="truncate text-sm text-ink-2">{getPerson(t.requesterId).name}</span></div>}
      <div className="hidden min-w-0 items-center gap-2 lg:flex">{t.assigneeId ? <><Avatar name={getPerson(t.assigneeId).name} size={24} /><span className="truncate text-sm text-ink-2">{getPerson(t.assigneeId).name}</span></> : staff ? <Badge tone="bad">Unassigned</Badge> : <span className="text-sm text-ink-3">Unassigned</span>}</div>
      <div className="hidden text-right text-xs text-ink-3 lg:block">{timeAgo(t.updatedAt)}</div>
      <div className="col-span-full flex flex-wrap items-center gap-2 lg:hidden"><StatusPill status={t.status} /><PriorityPill priority={t.priority} /><SlaChip ticket={t} now={now} /><span className="ml-auto text-xs text-ink-3">{timeAgo(t.updatedAt)}</span></div>
    </div>
  );
}

function Board({ list, now, staff, onMove }) {
  const cols = STATUSES.filter(s => s.id !== 'closed'); const [over, setOver] = useState(null);
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {cols.map(c => {
        const items = list.filter(t => t.status === c.id || (c.id === 'resolved' && t.status === 'closed'));
        return (
          <div key={c.id} onDragOver={(e) => { e.preventDefault(); setOver(c.id); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/ticket'); if (id) onMove(id, c.id); }}
            className={cn('w-[290px] shrink-0 rounded-xl bg-ink/[0.07] p-2.5 transition', over === c.id && 'ring-2 ring-accent')}>
            <div className="flex items-center justify-between px-2 py-1.5"><StatusPill status={c.id} /><span className="num text-xs text-ink-3">{items.length}</span></div>
            <div className="mt-2 space-y-2.5">
              {items.map(t => (
                <div key={t.id} draggable={staff} onDragStart={(e) => e.dataTransfer.setData('text/ticket', t.id)} onClick={() => navigate(`/app/tickets/${t.id}`)} className="cursor-pointer rounded-lg bg-surface p-3.5 shadow-card transition hover:shadow-pop">
                  <div className="flex items-center justify-between"><span className="font-mono text-xs text-ink-3">{t.id}</span><PriorityPill priority={t.priority} compact /></div>
                  <p className="mt-1.5 text-sm font-medium leading-snug">{t.subject}</p>
                  <div className="mt-3 flex items-center justify-between"><SlaChip ticket={t} now={now} />{t.assigneeId ? <Avatar name={getPerson(t.assigneeId).name} size={22} /> : <Badge tone="bad">Unassigned</Badge>}</div>
                </div>))}
              {items.length === 0 && <p className="rounded-lg border border-dashed border-line-strong px-3 py-8 text-center text-xs text-ink-3">Nothing here</p>}
            </div>
          </div>);
      })}
    </div>
  );
}

export function Tickets() {
  const { user, tickets, actions, toast, savedViews } = useStore(); const { query } = useRoute(); const now = useNow(30000);
  const staff = user.role === 'admin';
  const [tab, setTab] = useState(query.sla ? 'risk' : query.assignee === 'none' ? 'unassigned' : 'open');
  const [q, setQ] = useState(''); const [fs, setFs] = useState([]); const [fc, setFc] = useState([]); const [fp, setFp] = useState([]); const [fa, setFa] = useState([]);
  const [sort, setSort] = useState('updated'); const [view, setView] = useState('list'); const [sel, setSel] = useState([]); const [limit, setLimit] = useState(12);
  const base = useMemo(() => staff ? tickets : tickets.filter(t => t.requesterId === user.id), [tickets, staff, user]);
  const counts = useMemo(() => ({
    open: base.filter(isOpen).length, unassigned: base.filter(t => isOpen(t) && !t.assigneeId).length, risk: base.filter(t => isOpen(t) && ['at_risk', 'breached'].includes(slaOf(t, now).state)).length,
    waiting: base.filter(t => t.status === 'waiting').length, resolved: base.filter(t => !isOpen(t)).length, all: base.length,
  }), [base, now]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return base.filter(t => {
      if (tab === 'open' && !isOpen(t)) return false; if (tab === 'unassigned' && !(isOpen(t) && !t.assigneeId)) return false;
      if (tab === 'risk' && !(isOpen(t) && ['at_risk', 'breached'].includes(slaOf(t, now).state))) return false; if (tab === 'waiting' && t.status !== 'waiting') return false; if (tab === 'resolved' && isOpen(t)) return false;
      if (fs.length && !fs.includes(t.status)) return false; if (fc.length && !fc.includes(t.category)) return false; if (fp.length && !fp.includes(t.priority)) return false; if (fa.length && !fa.includes(t.assigneeId || 'none')) return false;
      if (s && !(`${t.id} ${t.subject} ${t.description} ${getPerson(t.requesterId).name}`.toLowerCase().includes(s))) return false;
      return true;
    }).sort(SORTS[sort][1]);
  }, [base, tab, q, fs, fc, fp, fa, sort, now]);
  useEffect(() => { setSel([]); setLimit(12); }, [tab, q, fs, fc, fp, fa]);
  const hasFilters = fs.length + fc.length + fp.length + fa.length > 0 || q;
  const allSel = list.length > 0 && sel.length === Math.min(list.length, limit);
  const tabs = staff
    ? [{ value: 'open', label: 'Open', count: counts.open }, { value: 'unassigned', label: 'Unassigned', count: counts.unassigned }, { value: 'risk', label: 'At risk or overdue', count: counts.risk }, { value: 'resolved', label: 'Resolved', count: counts.resolved }, { value: 'all', label: 'All', count: counts.all }]
    : [{ value: 'open', label: 'Open', count: counts.open }, { value: 'waiting', label: 'Waiting on you', count: counts.waiting }, { value: 'resolved', label: 'Resolved', count: counts.resolved }, { value: 'all', label: 'All', count: counts.all }];
  const exportCsv = () => { download('requests.csv', ['ID,Subject,Category,Priority,Status,Requester,Assignee,Created', ...list.map(t => [t.id, `"${t.subject.replace(/"/g, '""')}"`, categoryMeta(t.category).name, t.priority, statusMeta(t.status).name, getPerson(t.requesterId).name, t.assigneeId ? getPerson(t.assigneeId).name : '', fmtDate(t.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })].join(','))].join('\n'), 'text/csv'); toast({ title: `Exported ${list.length} requests`, body: 'requests.csv' }); };
  const bulk = (patch, msg) => { actions.bulkUpdate(sel, patch); toast({ title: `${sel.length} requests updated`, body: msg }); setSel([]); };
  const move = (id, status) => { const t = tickets.find(x => x.id === id); if (t && t.status !== status) { actions.updateTicket(id, { status }); toast({ title: `${id} moved to ${statusMeta(status).name}` }); } };

  return (
    <div>
      <PageHeader title={staff ? 'Request queue' : 'My requests'} subtitle={staff ? 'Everything students and staff have raised. Assign, reply and resolve from here.' : 'Track everything you have raised, from first reply to resolution.'}
        actions={<>{staff && <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>}{!staff && <Button icon={Plus} onClick={() => navigate('/app/tickets/new')}>New request</Button>}</>} />
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-4" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1 sm:max-w-xs"><Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, subject or person" aria-label="Search requests" className="!h-9" /></div>
        <FilterMenu label="Status" value={fs} onChange={setFs} options={STATUSES.map(s => ({ value: s.id, label: s.name }))} />
        <FilterMenu label="Category" value={fc} onChange={setFc} options={CATEGORIES.map(c => ({ value: c.id, label: c.name }))} />
        <FilterMenu label="Priority" value={fp} onChange={setFp} options={PRIORITIES.map(p => ({ value: p.id, label: p.name }))} />
        {staff && <FilterMenu label="Assignee" value={fa} onChange={setFa} options={[{ value: 'none', label: 'Unassigned' }, ...AGENTS.map(a => ({ value: a.id, label: a.name }))]} />}
        {hasFilters && <button onClick={() => { setQ(''); setFs([]); setFc([]); setFp([]); setFa([]); }} className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-ink-2 hover:text-ink"><X className="h-3.5 w-3.5" />Clear all</button>}
        <div className="ml-auto flex items-center gap-2">
          <Popover width="w-52" trigger={({ toggle }) => <button onClick={toggle} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-3"><ArrowUpDown className="h-3.5 w-3.5" />{SORTS[sort][0]}</button>}>
            {(close) => <div className="p-1.5">{Object.entries(SORTS).map(([k, [l]]) => <MenuItem key={k} active={sort === k} onClick={() => { setSort(k); close(); }}>{l}</MenuItem>)}</div>}
          </Popover>
          <Segmented size="sm" value={view} onChange={setView} label="View" options={[{ value: 'list', label: 'List', icon: LayoutList }, { value: 'board', label: 'Board', icon: Columns3 }]} />
        </div>
      </div>

      {staff && sel.length > 0 && (
        <div className="sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-sb-bg px-4 py-2.5 text-sb-fg shadow-pop animate-pop">
          <span className="num text-sm font-medium">{sel.length} selected</span><span className="mx-2 h-4 w-px bg-sb-fg/30" />
          <Popover align="left" width="w-56" trigger={({ toggle }) => <button onClick={toggle} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium hover:bg-sb-fg/15"><UserPlus className="h-4 w-4" />Assign</button>}>
            {(close) => <div className="p-1.5 text-ink">{AGENTS.map(a => <MenuItem key={a.id} onClick={() => { close(); bulk({ assigneeId: a.id, status: 'in_review' }, `Assigned to ${a.name}`); }}>{a.name}<span className="ml-2 text-xs text-ink-3">{a.team}</span></MenuItem>)}</div>}
          </Popover>
          <Popover align="left" width="w-52" trigger={({ toggle }) => <button onClick={toggle} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium hover:bg-sb-fg/15">Set status<ChevronDown className="h-3.5 w-3.5" /></button>}>
            {(close) => <div className="p-1.5 text-ink">{STATUSES.map(s => <MenuItem key={s.id} onClick={() => { close(); bulk({ status: s.id }, `Status set to ${s.name}`); }}>{s.name}</MenuItem>)}</div>}
          </Popover>
          <Popover align="left" width="w-44" trigger={({ toggle }) => <button onClick={toggle} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium hover:bg-sb-fg/15">Set priority<ChevronDown className="h-3.5 w-3.5" /></button>}>
            {(close) => <div className="p-1.5 text-ink">{PRIORITIES.map(p => <MenuItem key={p.id} onClick={() => { close(); bulk({ priority: p.id }, `Priority set to ${p.name}`); }}>{p.name}</MenuItem>)}</div>}
          </Popover>
          <button onClick={() => setSel([])} className="ml-auto text-[13px] font-medium opacity-80 hover:opacity-100">Clear selection</button>
        </div>
      )}

      {view === 'board' ? <Board list={list} now={now} staff={staff} onMove={move} /> : (
        <Card pad={false} className="overflow-hidden">
          {list.length > 0 && (
            <div className={cn('hidden items-center gap-x-4 border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium text-ink-3 lg:grid', staff ? 'lg:grid-cols-[auto_minmax(0,1fr)_120px_90px_130px_140px_140px_72px]' : 'lg:grid-cols-[minmax(0,1fr)_120px_90px_130px_150px_90px]')}>
              {staff && <Checkbox checked={allSel} indeterminate={sel.length > 0} onChange={(v) => setSel(v ? list.slice(0, limit).map(t => t.id) : [])} label="Select all" />}
              <span>Request</span><span>Status</span><span>Priority</span><span>Target</span>{staff && <span>Requester</span>}<span>{staff ? 'Assignee' : 'Handled by'}</span><span className="text-right">Updated</span>
            </div>)}
          {list.slice(0, limit).map(t => <Row key={t.id} t={t} now={now} staff={staff} selected={sel.includes(t.id)} onSelect={(v) => setSel(v ? [...sel, t.id] : sel.filter(x => x !== t.id))} />)}
          {list.length === 0 && (hasFilters
            ? <EmptyState title="No requests match these filters" body="Try removing a filter or searching for a different word." action={<Button variant="secondary" onClick={() => { setQ(''); setFs([]); setFc([]); setFp([]); setFa([]); }}>Clear filters</Button>} />
            : <EmptyState icon={Inbox} title={tab === 'open' ? 'Nothing open right now' : 'No requests here yet'} body={staff ? 'New requests will appear in the queue as soon as they are raised.' : 'When something goes wrong on campus, raise a request and we will route it to the right team.'} action={!staff && <Button icon={Plus} onClick={() => navigate('/app/tickets/new')}>Raise a request</Button>} />)}
          {list.length > limit && <div className="border-t border-line p-3 text-center"><Button variant="ghost" onClick={() => setLimit(l => l + 12)}>Show {Math.min(12, list.length - limit)} more of {list.length - limit}</Button></div>}
        </Card>
      )}
      <p className="num mt-3 text-xs text-ink-3">Showing {Math.min(limit, list.length)} of {list.length} requests</p>
    </div>
  );
}
