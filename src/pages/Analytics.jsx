import { useMemo, useState, useEffect } from 'react';
import { Download, Inbox, Timer, CheckCircle2, Star } from 'lucide-react';
import { useStore } from '../store/store';
import { api } from '../services/api';
import { buildAnalytics } from '../lib/analytics';
import { download } from '../lib/utils';
import { PageHeader, Card, StatTile, SectionTitle, Segmented, Button, Avatar, Stars } from '../components/ui';
import { LineChart, HBars, Donut, Heatmap, CAT } from '../components/charts';

export function Analytics() {
  const { tickets, toast } = useStore();
  const [range, setRange] = useState(30);
  const [remoteData, setRemoteData] = useState(null);

  useEffect(() => {
    api.getAnalyticsOverview()
      .then(setRemoteData)
      .catch(() => {});
  }, []);

  const an = useMemo(() => remoteData || buildAnalytics(tickets), [remoteData, tickets]);
  const sl = (a) => a.slice(-range); const sum = (a) => sl(a).reduce((x, y) => x + y, 0);
  const cats = an.byCategory; const top = cats.slice(0, 5); const other = cats.slice(5).reduce((a, c) => a + c.value, 0);
  const parts = [...top.map((c, i) => ({ label: c.label, value: c.value, color: `var(${CAT[i]})` })), { label: 'Everything else', value: other, color: 'rgb(var(--ink-3))' }];
  const exp = () => { download('helpdesk-analytics.csv', ['Date,Created,Resolved', ...an.labels.map((l, i) => `${l},${an.created[i]},${an.resolved[i]}`)].join('\n'), 'text/csv'); toast('Exported helpdesk-analytics.csv'); };
  return (
    <div>
      <PageHeader title="Analytics" subtitle="How the helpdesk is performing. Figures are sample data for the demo." actions={<><Segmented value={range} onChange={setRange} label="Range" options={[{ value: 7, label: '7 days' }, { value: 14, label: '14 days' }, { value: 30, label: '30 days' }]} /><Button variant="secondary" icon={Download} onClick={exp}>Export</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Requests received" value={sum(an.created)} icon={Inbox} trend={{ text: '+8%', good: false }} sub={`last ${range} days`} />
        <StatTile label="First reply, median" value="1h 40m" icon={Timer} tone="violet" trend={{ text: '−22m', good: true }} sub="target 4h" />
        <StatTile label="Resolved within target" value={`${an.slaPct}%`} icon={CheckCircle2} tone="ok" trend={{ text: '+2 pts', good: true }} sub="target 90%" />
        <StatTile label="Satisfaction" value={`${an.csat} / 5`} icon={Star} tone="warn" trend={{ text: '+0.3', good: true }} sub="from rated requests" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card><SectionTitle title="Volume" sub="Requests created and resolved each day" /><LineChart height={260} labels={sl(an.labels)} series={[{ name: 'Created', color: 'rgb(var(--ac))', data: sl(an.created), area: true }, { name: 'Resolved', color: 'rgb(var(--ink-3))', data: sl(an.resolved), dash: '5 4' }]} /></Card>
        <Card><SectionTitle title="What people ask about" sub="Share of requests by topic" /><Donut parts={parts} center={{ value: sum(an.created), label: 'requests' }} /></Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card><SectionTitle title="On-time resolution by topic" sub="Percent resolved within target" /><HBars items={an.sla.slice(0, 7)} max={100} format={(v) => v + '%'} /></Card>
        <Card><SectionTitle title="Busiest times" sub="Requests by weekday and hour" /><Heatmap rows={an.weekdays} cols={an.hours} data={an.heat} /></Card>
        <Card><SectionTitle title="Satisfaction trend" sub="Average rating by week" /><LineChart height={190} yTicks={4} domain={[3.5, 5]} labels={['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'This wk']} series={[{ name: 'Rating', color: 'rgb(var(--ac))', data: an.csatWeeks, area: true }]} format={(v) => (+v).toFixed(1)} /></Card>
      </div>
      <Card pad={false} className="mt-6 overflow-hidden"><div className="px-5 pt-5"><SectionTitle title="Team performance" sub="Last 30 days" /></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b border-line bg-surface-2 text-left text-xs font-medium text-ink-3"><th className="px-5 py-2.5">Person</th><th className="py-2.5">Team</th><th className="py-2.5 text-right">Open now</th><th className="py-2.5 text-right">Resolved</th><th className="py-2.5 text-right">Avg resolution</th><th className="px-5 py-2.5 text-right">Rating</th></tr></thead>
          <tbody>{an.team.map(a => <tr key={a.id} className="border-b border-line last:border-0 hover:bg-surface-2"><td className="px-5 row-pad"><span className="flex items-center gap-3"><Avatar name={a.name} size={28} /><span className="font-medium">{a.name}</span></span></td><td className="text-ink-2">{a.team}</td><td className="num text-right">{a.open}</td><td className="num text-right">{a.resolved}</td><td className="num text-right">{a.avg}h</td><td className="px-5 text-right"><span className="inline-flex items-center gap-2"><Stars value={Math.round(a.csat)} size={13} /><span className="num w-7">{a.csat}</span></span></td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
