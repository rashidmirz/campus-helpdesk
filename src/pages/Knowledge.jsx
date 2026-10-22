import { useMemo, useState, useEffect } from 'react';
import { Search, ArrowLeft, ThumbsUp, ThumbsDown, Clock, Eye, ArrowRight, Lightbulb, LifeBuoy, BookOpen } from 'lucide-react';
import { Link, navigate } from '../lib/router';
import { useStore, categoryMeta } from '../store/store';
import { api } from '../services/api';
import { KB, CATEGORIES } from '../data/seed';
import { cn, timeAgo, DAY } from '../lib/utils';
import { Button, Card, Badge, Input, EmptyState, PageHeader, Divider } from '../components/ui';
import { NamedIcon } from '../components/ui/icons';

const Hit = ({ a }) => {
  const cat = categoryMeta(a.category);
  return (
    <Link to={`/app/knowledge/${a.slug}`} className="card group flex gap-4 p-5 transition hover:shadow-pop">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-softfg"><NamedIcon name={cat.icon} className="h-5 w-5" /></span>
      <div className="min-w-0"><h3 className="font-medium leading-snug group-hover:text-accent-softfg">{a.title}</h3><p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{a.summary}</p><p className="mt-2.5 flex items-center gap-3 text-xs text-ink-3"><span>{cat.name}</span><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{a.mins} min</span><span className="num inline-flex items-center gap-1"><Eye className="h-3 w-3" />{a.views.toLocaleString('en-IN')}</span></p></div>
    </Link>
  );
};

export function Knowledge() {
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all');
  const list = useMemo(() => { const s = q.trim().toLowerCase(); return KB.filter(a => (cat === 'all' || a.category === cat) && (!s || `${a.title} ${a.summary}`.toLowerCase().includes(s) || a.body.some(b => (b.v?.join ? b.v.join(' ') : b.v).toLowerCase().includes(s)))); }, [q, cat]);
  const popular = [...KB].sort((a, b) => b.views - a.views).slice(0, 4);
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-sb-bg px-6 py-12 text-white sm:px-12" style={{ background: 'rgb(var(--ac-900))' }}>
        <div className="dotgrid absolute inset-0 opacity-25 invert" aria-hidden />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="font-display text-[32px] leading-tight sm:text-[42px]">How can we help?</h1>
          <p className="mt-3 text-white/75">Search {KB.length} articles written by the teams who fix these problems every day.</p>
          <div className="relative mt-7"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search help articles" placeholder="Try “Wi-Fi”, “hall ticket” or “refund”" className="h-14 w-full rounded-xl bg-surface pl-12 pr-4 text-base text-ink shadow-pop placeholder:text-ink-3 focus:outline-none focus:ring-4 focus:ring-white/30" /></div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Topics">
        {[{ id: 'all', name: 'All topics' }, ...CATEGORIES.filter(c => KB.some(a => a.category === c.id))].map(c => <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)} className={cn('h-9 rounded-full px-4 text-[13px] font-medium transition', cat === c.id ? 'bg-accent-soft text-accent-softfg ring-1 ring-accent' : 'bg-surface text-ink-2 shadow-card hover:text-ink')}>{c.name}</button>)}
      </div>
      {!q && cat === 'all' && (<section className="mt-8"><h2 className="mb-3 font-display text-lg">Most read this month</h2><div className="grid gap-4 md:grid-cols-2">{popular.map(a => <Hit key={a.id} a={a} />)}</div></section>)}
      <section className="mt-8"><h2 className="mb-3 font-display text-lg">{q ? `${list.length} result${list.length === 1 ? '' : 's'} for “${q}”` : cat === 'all' ? 'All articles' : categoryMeta(cat).name}</h2>
        {list.length ? <div className="grid gap-4 md:grid-cols-2">{list.map(a => <Hit key={a.id} a={a} />)}</div> : <Card><EmptyState icon={LifeBuoy} title="No articles match your search" body="Try fewer words, or send your question to the team. They usually reply within a few hours." action={<Button onClick={() => navigate(`/app/tickets/new?subject=${encodeURIComponent(q)}`)}>Raise a request</Button>} /></Card>}
      </section>
      <Card className="mt-10 flex flex-wrap items-center justify-between gap-4 !bg-accent-soft shadow-none"><div><h2 className="font-display text-lg">Did not find what you need?</h2><p className="text-sm text-ink-2">Ask Oak for an instant answer, or raise a request for the team.</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate('/app/assistant')}>Ask Oak</Button><Button onClick={() => navigate('/app/tickets/new')}>Raise a request</Button></div></Card>
    </div>
  );
}

export function Block({ b }) {
  if (b.t === 'p') return <p>{b.v}</p>;
  if (b.t === 'h') return <h3>{b.v}</h3>;
  if (b.t === 'ul') return <ul>{b.v.map((x, i) => <li key={i}>{x}</li>)}</ul>;
  if (b.t === 'ol') return <ol>{b.v.map((x, i) => <li key={i}>{x}</li>)}</ol>;
  return <div className="my-6 flex gap-3 rounded-xl bg-accent-soft p-4 text-sm leading-relaxed text-accent-softfg"><Lightbulb className="mt-0.5 h-5 w-5 shrink-0" /><p>{b.v}</p></div>;
}

export function Article({ slug }) {
  const { kbVotes, actions, toast } = useStore();
  const [remoteArticle, setRemoteArticle] = useState(null);

  useEffect(() => {
    api.getKBArticle(slug)
      .then(setRemoteArticle)
      .catch(() => {});
  }, [slug]);

  const a = remoteArticle || KB.find(x => x.slug === slug);
  if (!a) return <EmptyState title="Article not found" body="It may have been moved or renamed." action={<Button onClick={() => navigate('/app/knowledge')}>Browse all articles</Button>} />;
  const cat = categoryMeta(a.category);
  const vote = kbVotes[a.id] !== undefined ? kbVotes[a.id] : a.userVote;
  const related = KB.filter(x => x.id !== a.id && x.category === a.category).concat(KB.filter(x => x.category !== a.category)).slice(0, 3);
  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article className="min-w-0">
        <Link to="/app/knowledge" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" />Knowledge base</Link>
        <Badge tone="accent"><NamedIcon name={cat.icon} className="h-3.5 w-3.5" />{cat.name}</Badge>
        <h1 className="mt-4 font-display text-[32px] leading-tight sm:text-[40px]">{a.title}</h1>
        <p className="mt-3 text-lg text-ink-2">{a.summary}</p>
        <p className="mt-4 flex flex-wrap gap-x-4 text-sm text-ink-3"><span>Updated {timeAgo(Date.now() - a.updated * DAY)}</span><span>{a.mins} min read</span><span className="num">{a.views.toLocaleString('en-IN')} views</span></p>
        <Divider className="my-7" />
        <div className="prose-kb max-w-[68ch] text-[16px]">{a.body.map((b, i) => <Block key={i} b={b} />)}</div>
        <Divider className="my-8" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-medium">Was this article helpful?</p><p className="text-sm text-ink-3">{vote === undefined ? `${a.up} of ${a.up + a.down} people said yes` : vote ? 'Glad it helped. Thank you.' : 'Thanks. We will improve it.'}</p></div>
          <div className="flex gap-2"><Button variant={vote === true ? 'soft' : 'secondary'} icon={ThumbsUp} onClick={() => { actions.voteKb(a.id, true); }} aria-pressed={vote === true}>Yes</Button><Button variant={vote === false ? 'soft' : 'secondary'} icon={ThumbsDown} onClick={() => actions.voteKb(a.id, false)} aria-pressed={vote === false}>No</Button></div>
        </div>
        {vote === false && <Card className="mt-5 animate-fade"><p className="font-medium">Sorry that did not solve it.</p><p className="mt-0.5 text-sm text-ink-2">Send us the details and the {cat.team} team will take it from here.</p><Button className="mt-4" onClick={() => navigate(`/app/tickets/new?cat=${a.category}&subject=${encodeURIComponent(a.title)}`)} iconRight={ArrowRight}>Raise a request</Button></Card>}
      </article>
      <aside className="space-y-4 lg:pt-9">
        <Card><h2 className="mb-3 font-display text-base">Keep reading</h2><ul className="space-y-3">{related.map(r => <li key={r.id}><Link to={`/app/knowledge/${r.slug}`} className="flex gap-2.5 text-sm hover:text-accent-softfg"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" /><span>{r.title}</span></Link></li>)}</ul></Card>
        <Card className="!bg-accent-soft shadow-none"><p className="font-medium text-accent-softfg">Still stuck?</p><p className="mt-1 text-sm text-ink-2">Talk to {cat.team}. We usually reply within 4 hours.</p><Button className="mt-3 w-full" onClick={() => navigate(`/app/tickets/new?cat=${a.category}&subject=${encodeURIComponent(a.title)}`)}>Raise a request</Button></Card>
      </aside>
    </div>
  );
}
