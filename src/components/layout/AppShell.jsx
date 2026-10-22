import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutDashboard, Ticket, BookOpen, Bot, ClipboardCheck, Wallet, FileBadge, PackageSearch, CalendarDays, Settings, BarChart3, Users, Megaphone, Search, Bell, Moon, Sun, Plus, PanelLeftClose, PanelLeftOpen, Menu, LogOut, User as UserIcon, Repeat, Command, CornerDownLeft, ArrowUp, ArrowDown, Palette, CheckCheck, ChevronsUpDown, X } from 'lucide-react';
import { cn, timeAgo } from '../../lib/utils';
import { Link, navigate, useRoute } from '../../lib/router';
import { useStore, getPerson } from '../../store/store';
import { useTheme } from '../../lib/theme';
import { isOpen } from '../../lib/sla';
import { Avatar, Badge, Popover, MenuItem, IconButton, Kbd, Button, Toaster } from '../ui';
import { LogoMark, Wordmark } from './Logo';
import { KB, CATEGORIES } from '../../data/seed';

const NAV = (role, counts) => {
  const dash = { to: '/app', label: 'Overview', icon: LayoutDashboard, exact: true };
  const kb = { to: '/app/knowledge', label: 'Knowledge base', icon: BookOpen };
  if (role === 'admin') return [
    { items: [dash, { to: '/app/tickets', label: 'Request queue', icon: Ticket, badge: counts.unassigned || null, tone: 'bad' }, { to: '/app/analytics', label: 'Analytics', icon: BarChart3 }] },
    { label: 'Manage', items: [kb, { to: '/app/people', label: 'People', icon: Users }, { to: '/app/announcements', label: 'Announcements', icon: Megaphone }, { to: '/app/fees', label: 'Fee collection', icon: Wallet }] },
    { label: 'Campus', items: [{ to: '/app/events', label: 'Events', icon: CalendarDays }, { to: '/app/lost-found', label: 'Lost & Found', icon: PackageSearch }] },
  ];
  const mine = { to: '/app/tickets', label: role === 'faculty' ? 'My requests' : 'My requests', icon: Ticket, badge: counts.open || null };
  const common = [{ to: '/app/exams', label: role === 'faculty' ? 'Exam duties' : 'Exams', icon: ClipboardCheck }, ...(role === 'student' ? [{ to: '/app/fees', label: 'Fees', icon: Wallet }] : []), { to: '/app/documents', label: 'Documents', icon: FileBadge }, { to: '/app/lost-found', label: 'Lost & Found', icon: PackageSearch }, { to: '/app/events', label: 'Events', icon: CalendarDays }];
  return [{ items: [dash, mine, kb, { to: '/app/assistant', label: 'Ask Oak', icon: Bot, badge: 'AI', tone: 'accent' }] }, { label: 'Campus', items: common }];
};

function Sidebar({ collapsed, setCollapsed, mobile, onNavigate }) {
  const { path } = useRoute(); const { user, tickets } = useStore();
  const counts = useMemo(() => ({ open: tickets.filter(t => t.requesterId === user.id && isOpen(t)).length, unassigned: tickets.filter(t => !t.assigneeId && isOpen(t)).length }), [tickets, user]);
  const groups = NAV(user.role, counts); const c = collapsed && !mobile;
  const active = (it) => it.exact ? path === it.to : path === it.to || path.startsWith(it.to + '/');
  return (
    <aside className={cn('flex h-full flex-col bg-sb-bg text-sb-fg border-r border-sb-line transition-[width] duration-200', mobile ? 'w-72' : c ? 'w-[72px]' : 'w-[264px]')} aria-label="Primary">
      <div className={cn('flex h-16 shrink-0 items-center border-b border-sb-line', c ? 'justify-center' : 'px-5 gap-3')}>
        <Link to="/app" onClick={onNavigate} className="flex items-center gap-3" aria-label="Silver Oak Helpdesk home"><LogoMark size={34} />{!c && <Wordmark light={false} className="[&>span:first-child]:!text-sb-fg [&>span:last-child]:!text-sb-dim" />}</Link>
      </div>
      {user.role !== 'admin' && (
        <div className={cn('pt-4', c ? 'px-3' : 'px-4')}>
          <Link to="/app/tickets/new" onClick={onNavigate} title="New request" className={cn('flex items-center justify-center gap-2 rounded-lg bg-accent font-medium text-accent-on shadow-sm transition hover:bg-accent-hover', c ? 'h-10 w-full' : 'h-10 w-full text-sm')}><Plus className="h-4 w-4" />{!c && 'New request'}</Link>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.label && !c && <p className="mb-1.5 px-3 text-xs font-medium text-sb-dim">{g.label}</p>}
            {g.label && c && <div className="mx-3 mb-2 h-px bg-sb-line" />}
            <ul className="space-y-0.5">{g.items.map(it => { const on = active(it); return (
              <li key={it.to}>
                <Link to={it.to} onClick={onNavigate} title={c ? it.label : undefined} aria-current={on ? 'page' : undefined}
                  className={cn('group relative flex items-center gap-3 rounded-lg text-sm font-medium transition', c ? 'h-10 justify-center' : 'h-10 px-3', on ? 'bg-sb-active text-sb-activefg' : 'text-sb-fg/80 hover:bg-sb-hover hover:text-sb-fg')}>
                  <it.icon className="h-[18px] w-[18px] shrink-0" />
                  {!c && <span className="flex-1 truncate">{it.label}</span>}
                  {it.badge && !c && <span className={cn('num rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none', it.tone === 'bad' ? 'bg-bad text-white' : it.tone === 'accent' ? 'bg-accent text-accent-on' : on ? 'bg-accent-soft text-accent-softfg' : 'bg-sb-hover text-sb-fg')}>{it.badge}</span>}
                  {it.badge && c && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-sb-bg" />}
                </Link>
              </li>); })}</ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sb-line p-3 space-y-1">
        <Link to="/app/settings" onClick={onNavigate} className={cn('flex h-10 items-center gap-3 rounded-lg text-sm font-medium text-sb-fg/80 hover:bg-sb-hover hover:text-sb-fg', c ? 'justify-center' : 'px-3', path.startsWith('/app/settings') && 'bg-sb-active !text-sb-activefg')} title="Settings"><Settings className="h-[18px] w-[18px]" />{!c && 'Settings & appearance'}</Link>
        {!mobile && <button onClick={() => setCollapsed(!c)} className={cn('hidden lg:flex h-10 w-full items-center gap-3 rounded-lg text-sm font-medium text-sb-dim hover:bg-sb-hover hover:text-sb-fg', c ? 'justify-center' : 'px-3')} aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'}>{c ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <><PanelLeftClose className="h-[18px] w-[18px]" />Collapse</>}</button>}
      </div>
    </aside>
  );
}

function Notifications() {
  const { notifications, user, actions } = useStore();
  const mine = notifications.filter(n => n.forUser === user.id).sort((a, b) => b.at - a.at);
  const unread = mine.filter(n => !n.read).length;
  return (
    <Popover width="w-[min(92vw,380px)]" trigger={({ toggle, open }) => (
      <IconButton label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={toggle} active={open} className="relative"><Bell className="h-[18px] w-[18px]" />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-bad ring-2 ring-surface" />}</IconButton>)}>
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line"><h3 className="font-display text-sm">Notifications</h3><button onClick={() => actions.markRead('all')} className="inline-flex items-center gap-1 text-xs font-medium text-accent-softfg hover:underline"><CheckCheck className="h-3.5 w-3.5" />Mark all read</button></div>
          <ul className="max-h-[60vh] overflow-y-auto p-1.5">
            {mine.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink-2">You are all caught up.</li>}
            {mine.map(n => (
              <li key={n.id}><button onClick={() => { actions.markRead(n.id); close(); navigate(n.link); }} className="flex w-full gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-3">
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-accent')} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-ink">{n.title}</span><span className="block text-[13px] text-ink-2 line-clamp-2">{n.body}</span><span className="mt-0.5 block text-xs text-ink-3">{timeAgo(n.at)}</span></span>
              </button></li>))}
          </ul>
        </div>)}
    </Popover>
  );
}

function UserMenu() {
  const { user, logout } = useStore();
  return (
    <Popover width="w-72" trigger={({ toggle }) => (
      <button onClick={toggle} className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-3" aria-label="Account menu">
        <Avatar name={user.name} size={32} /><span className="hidden text-left leading-tight md:block"><span className="block text-sm font-medium text-ink">{user.name}</span><span className="block text-xs text-ink-3 capitalize">{user.role === 'admin' ? 'Helpdesk admin' : user.role}</span></span><ChevronsUpDown className="hidden h-4 w-4 text-ink-3 md:block" />
      </button>)}>
      {(close) => (
        <div className="p-1.5">
          <div className="flex items-center gap-3 px-2.5 py-3"><Avatar name={user.name} size={40} /><div className="min-w-0"><p className="truncate text-sm font-medium">{user.name}</p><p className="truncate text-xs text-ink-2">{user.email}</p></div></div>
          <div className="my-1 h-px bg-line" />
          <MenuItem icon={UserIcon} onClick={() => { close(); navigate('/app/settings'); }}>Profile and settings</MenuItem>
          <MenuItem icon={Palette} onClick={() => { close(); navigate('/app/settings?tab=appearance'); }}>Customize appearance</MenuItem>
          <div className="my-1 h-px bg-line" />
          <MenuItem icon={LogOut} danger onClick={() => { close(); logout(); }}>Sign out</MenuItem>
        </div>)}
    </Popover>
  );
}

/* ── Command palette ─────────────────────────────────────────────────── */
function CommandPalette({ open, onClose }) {
  const { tickets, user, logout } = useStore(); const { toggleMode } = useTheme();
  const [q, setQ] = useState(''); const [idx, setIdx] = useState(0); const inp = useRef();
  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => inp.current?.focus(), 20); } }, [open]);
  const items = useMemo(() => {
    const go = (to) => () => navigate(to);
    const pages = [
      { g: 'Go to', t: 'Overview', i: LayoutDashboard, run: go('/app') }, { g: 'Go to', t: user.role === 'admin' ? 'Request queue' : 'My requests', i: Ticket, run: go('/app/tickets') },
      { g: 'Go to', t: 'Knowledge base', i: BookOpen, run: go('/app/knowledge') }, { g: 'Go to', t: 'Events', i: CalendarDays, run: go('/app/events') }, { g: 'Go to', t: 'Lost & Found', i: PackageSearch, run: go('/app/lost-found') },
      ...(user.role !== 'admin' ? [{ g: 'Go to', t: 'Ask Oak (assistant)', i: Bot, run: go('/app/assistant') }, { g: 'Go to', t: 'Exams', i: ClipboardCheck, run: go('/app/exams') }, { g: 'Go to', t: 'Documents', i: FileBadge, run: go('/app/documents') }] : [{ g: 'Go to', t: 'Analytics', i: BarChart3, run: go('/app/analytics') }, { g: 'Go to', t: 'People', i: Users, run: go('/app/people') }, { g: 'Go to', t: 'Announcements', i: Megaphone, run: go('/app/announcements') }]),
      { g: 'Go to', t: 'Settings', i: Settings, run: go('/app/settings') },
    ];
    const actions = [
      ...(user.role !== 'admin' ? [{ g: 'Actions', t: 'Create a new request', i: Plus, run: go('/app/tickets/new') }] : []),
      { g: 'Actions', t: 'Toggle dark mode', i: Moon, run: toggleMode }, { g: 'Actions', t: 'Customize appearance', i: Palette, run: go('/app/settings?tab=appearance') },
      { g: 'Actions', t: 'Sign out', i: LogOut, run: logout },
    ];
    const vis = user.role === 'admin' ? tickets : tickets.filter(t => t.requesterId === user.id);
    const tk = vis.map(t => ({ g: 'Requests', t: `${t.id} · ${t.subject}`, i: Ticket, run: go(`/app/tickets/${t.id}`) }));
    const kb = KB.map(a => ({ g: 'Help articles', t: a.title, i: BookOpen, run: go(`/app/knowledge/${a.slug}`) }));
    const all = [...pages, ...actions, ...tk, ...kb];
    const s = q.trim().toLowerCase();
    if (!s) return [...pages.slice(0, 5), ...actions.slice(0, 3), ...tk.slice(0, 3)];
    return all.filter(x => s.split(/\s+/).every(w => x.t.toLowerCase().includes(w))).slice(0, 12);
  }, [q, tickets, user, toggleMode, logout]);
  useEffect(() => setIdx(0), [q]);
  if (!open) return null;
  const choose = (it) => { onClose(); it?.run(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(items.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') choose(items[idx]);
    else if (e.key === 'Escape') onClose();
  };
  let last = '';
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-pop animate-pop">
        <div className="flex items-center gap-3 border-b border-line px-4"><Search className="h-4 w-4 text-ink-3" /><input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search requests, articles, pages and actions" className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:shadow-none" aria-label="Search" /><Kbd>Esc</Kbd></div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink-2">No results for “{q}”. Try a request ID like HD-2041.</li>}
          {items.map((it, i) => { const head = it.g !== last; last = it.g; return (
            <li key={i} role="option" aria-selected={i === idx}>
              {head && <p className="px-3 pb-1 pt-2.5 text-xs font-medium text-ink-3">{it.g}</p>}
              <button onMouseMove={() => setIdx(i)} onClick={() => choose(it)} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm', i === idx ? 'bg-accent-soft text-accent-softfg' : 'text-ink')}><it.i className="h-4 w-4 shrink-0 opacity-70" /><span className="min-w-0 flex-1 truncate">{it.t}</span>{i === idx && <CornerDownLeft className="h-3.5 w-3.5 opacity-60" />}</button>
            </li>); })}
        </ul>
        <div className="flex items-center gap-4 border-t border-line bg-surface-2 px-4 py-2.5 text-xs text-ink-3"><span className="inline-flex items-center gap-1"><Kbd><ArrowUp className="h-3 w-3" /></Kbd><Kbd><ArrowDown className="h-3 w-3" /></Kbd>to move</span><span className="inline-flex items-center gap-1"><Kbd>↵</Kbd>to open</span></div>
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const { user, toasts, dismissToast } = useStore(); const { resolved, toggleMode } = useTheme();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('sou.sb') === '1'; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false); const [cmd, setCmd] = useState(false);
  const { path } = useRoute(); const main = useRef();
  useEffect(() => { try { localStorage.setItem('sou.sb', collapsed ? '1' : '0'); } catch { /* noop */ } }, [collapsed]);
  useEffect(() => { const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(o => !o); } else if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) { e.preventDefault(); setCmd(true); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  useEffect(() => { main.current?.scrollTo(0, 0); setMobileOpen(false); }, [path]);
  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <a href="#main" onClick={(e) => { e.preventDefault(); main.current?.focus(); }} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2">Skip to content</a>
      <div className="hidden lg:block h-full"><Sidebar collapsed={collapsed} setCollapsed={setCollapsed} /></div>
      {mobileOpen && <div className="fixed inset-0 z-[70] lg:hidden"><div className="absolute inset-0 bg-ink/50 animate-fade" onClick={() => setMobileOpen(false)} /><div className="absolute left-0 top-0 h-full"><Sidebar mobile onNavigate={() => setMobileOpen(false)} /></div></div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6 no-print">
          <IconButton label="Open menu" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></IconButton>
          <button onClick={() => setCmd(true)} className="group flex h-10 min-w-0 flex-1 max-w-md items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 text-sm text-ink-3 transition hover:border-line-strong">
            <Search className="h-4 w-4" /><span className="flex-1 truncate text-left">Search requests, articles, actions</span><span className="hidden sm:flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {user.role !== 'admin' && <Link to="/app/tickets/new" className="mr-1 hidden h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-[13px] font-medium text-accent-on hover:bg-accent-hover md:inline-flex lg:hidden"><Plus className="h-4 w-4" />New</Link>}
            <IconButton className="hidden sm:inline-flex" label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleMode}>{resolved === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</IconButton>
            <Notifications />
            <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
            <UserMenu />
          </div>
        </header>
        <main id="main" ref={main} tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
      <Toaster toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
