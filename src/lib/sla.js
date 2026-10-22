import { HOUR } from './utils';
import { PRIORITIES } from '../data/seed';

/** Returns { state, label, remaining, pct } for a ticket. state: met | breached | at_risk | on_track | paused */
export function slaOf(t, now = Date.now()) {
  const total = t.dueAt - t.createdAt;
  if (t.resolvedAt) { const met = t.resolvedAt <= t.dueAt; return { state: met ? 'met' : 'breached', remaining: t.dueAt - t.resolvedAt, pct: 1, total, done: true }; }
  if (t.status === 'waiting') return { state: 'paused', remaining: t.dueAt - now, pct: Math.min(1, (now - t.createdAt) / total), total };
  const remaining = t.dueAt - now, pct = Math.max(0, Math.min(1, (now - t.createdAt) / total));
  return { state: remaining < 0 ? 'breached' : pct > .75 ? 'at_risk' : 'on_track', remaining, pct, total };
}
export const priorityMeta = (id) => PRIORITIES.find(p => p.id === id);
export const isOpen = (t) => t.status !== 'resolved' && t.status !== 'closed';
export const dueFor = (createdAt, priority) => createdAt + priorityMeta(priority).slaHours * HOUR;
