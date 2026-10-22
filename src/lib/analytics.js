import { mulberry, DAY, HOUR } from './utils';
import { CATEGORIES, AGENTS } from '../data/seed';

/** Deterministic 30-day history so charts look real and stay stable between reloads. */
export function buildAnalytics(tickets, now = Date.now()) {
  const r = mulberry(2026); const days = 30;
  const labels = Array.from({ length: days }, (_, i) => new Date(now - (days - 1 - i) * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  const created = [], resolved = [];
  for (let i = 0; i < days; i++) {
    const wd = new Date(now - (days - 1 - i) * DAY).getDay(); const f = wd === 0 ? .35 : wd === 6 ? .55 : 1 + (wd === 1 ? .25 : 0);
    const c = Math.round((20 + r() * 12 + Math.sin(i / 4) * 3 + i * .15) * f); created.push(c); resolved.push(Math.round(c * (.86 + r() * .2)));
  }
  const weights = { it: 31, hostel: 18, fees: 14, exam: 12, cert: 9, facilities: 8, acad: 5, lib: 4, transport: 3, safety: 2 };
  const byCategory = CATEGORIES.map(c => ({ id: c.id, label: c.name, value: Math.round(weights[c.id] * 8.4 + r() * 6) })).sort((a, b) => b.value - a.value);
  const sla = CATEGORIES.map(c => ({ label: c.name, value: Math.round(88 + r() * 11 - (c.id === 'hostel' ? 7 : 0) - (c.id === 'it' ? 2 : 0)) })).sort((a, b) => a.value - b.value);
  const csatWeeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'This wk'].map((_, i) => +(4.2 + i * .07 + r() * .12).toFixed(2));
  const heat = Array.from({ length: 7 }, (_, d) => Array.from({ length: 12 }, (_, h) => Math.round(((h > 1 && h < 9 ? 1 : .35) * (d === 0 || d === 6 ? .35 : 1)) * (6 + r() * 10 + (h === 4 ? 6 : 0)))));
  const rated = tickets.filter(t => t.csat);
  const csat = rated.length ? +((rated.reduce((a, t) => a + t.csat.rating, 0) + 4.55 * 180) / (rated.length + 180)).toFixed(1) : 4.5;
  const team = AGENTS.map(a => ({ ...a, resolved: Math.round(40 + r() * 60), open: tickets.filter(t => t.assigneeId === a.id && t.status !== 'resolved' && t.status !== 'closed').length, csat: +(4.2 + r() * .7).toFixed(1), avg: Math.round(4 + r() * 18) }));
  return { labels, created, resolved, byCategory, sla, csatWeeks, heat, csat, team, totalMonth: created.reduce((a, b) => a + b, 0), resolvedMonth: resolved.reduce((a, b) => a + b, 0), firstReplyMin: 100, avgResolutionH: 11.4, slaPct: 94, weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], hours: Array.from({ length: 12 }, (_, i) => `${8 + i}:00`) };
}
