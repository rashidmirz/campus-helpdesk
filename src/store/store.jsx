import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api, getToken, removeToken, setOnUnauthorized } from '../services/api';
import { DEMO_USERS, AGENTS, STUDENTS, FACULTY, CATEGORIES, STATUSES } from '../data/seed';
import { uid } from '../lib/utils';
import { navigate } from '../lib/router';

const Store = createContext(null);

const personIndex = Object.fromEntries([
  ...STUDENTS.map(s => [s.id, { ...s, role: 'student', title: `${s.course} · ${s.sem} sem` }]),
  ...FACULTY.map(f => [f.id, { ...f, role: 'faculty', title: f.designation }]),
  ...AGENTS.map(a => [a.id, a]),
  ['ADM-001', { ...DEMO_USERS.admin }],
  ['ADM-002', { id: 'ADM-002', name: 'Neha Kapoor', role: 'admin', title: 'Helpdesk Operations', dept: 'Student Affairs' }],
]);

export const getPerson = (id) => personIndex[id] || { id, name: id || 'Unknown', role: 'student', title: '' };
export const statusMeta = (id) => STATUSES.find(s => s.id === id) || STATUSES[0];
export const categoryMeta = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

const INITIAL_STATE = {
  tickets: [],
  notifications: [],
  fees: [],
  receipts: [],
  announcements: [],
  lostFound: [],
  events: [],
  eventRegs: [],
  kbVotes: {},
  cannedReplies: [],
  savedViews: [],
  checklist: {},
  users: {},
  loading: true,
};

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [state, setState] = useState(INITIAL_STATE);
  const [toasts, setToasts] = useState([]);
  const pollTimer = useRef();

  const toast = useCallback((t) => {
    const id = uid('t');
    setToasts(x => [...x.slice(-3), { id, tone: 'ok', ...(typeof t === 'string' ? { title: t } : t) }]);
    setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), t?.duration || 4800);
  }, []);

  const dismissToast = useCallback((id) => setToasts(x => x.filter(y => y.id !== id)), []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setState(INITIAL_STATE);
    navigate('/login');
  }, []);

  // Configure auto logout on 401
  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
      toast({ title: 'Session expired', body: 'Please sign in again.', tone: 'bad' });
    });
  }, [logout, toast]);

  // Load all app data for logged in user
  const loadAppData = useCallback(async () => {
    try {
      const [
        ticketsRes, notifsRes, feesRes, receiptsRes,
        annRes, lfRes, evRes, cannedRes, viewsRes, checkRes
      ] = await Promise.all([
        api.getTickets().catch(() => []),
        api.getNotifications().catch(() => []),
        api.getFees().catch(() => []),
        api.getReceipts().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getLostFound().catch(() => []),
        api.getEvents().catch(() => []),
        api.getCannedReplies().catch(() => []),
        api.getSavedViews().catch(() => []),
        api.getChecklist().catch(() => ({})),
      ]);

      const eventRegs = Array.isArray(evRes) ? evRes.filter(e => e.isRegistered).map(e => e.id) : [];

      setState(s => ({
        ...s,
        tickets: Array.isArray(ticketsRes) ? ticketsRes : [],
        notifications: Array.isArray(notifsRes) ? notifsRes : [],
        fees: Array.isArray(feesRes) ? feesRes : [],
        receipts: Array.isArray(receiptsRes) ? receiptsRes : [],
        announcements: Array.isArray(annRes) ? annRes : [],
        lostFound: Array.isArray(lfRes) ? lfRes : [],
        events: Array.isArray(evRes) ? evRes : [],
        eventRegs,
        cannedReplies: Array.isArray(cannedRes) ? cannedRes : [],
        savedViews: Array.isArray(viewsRes) ? viewsRes : [],
        checklist: checkRes && typeof checkRes === 'object' ? checkRes : {},
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to load application data:', err);
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  // Initialize user from existing token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    api.getMe()
      .then(u => {
        setUser(u);
        loadAppData();
      })
      .catch(() => {
        removeToken();
        setUser(null);
        setState(s => ({ ...s, loading: false }));
      });
  }, [loadAppData]);

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (!user) return;
    clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const notifs = await api.getNotifications();
        if (Array.isArray(notifs)) {
          setState(s => ({ ...s, notifications: notifs }));
        }
      } catch (e) {
        // Silent poll error
      }
    }, 30000);
    return () => clearInterval(pollTimer.current);
  }, [user]);

  const login = useCallback(async (loginId, password) => {
    const res = await api.login(loginId, password);
    setUser(res.user);
    await loadAppData();
    navigate('/app');
    return res.user;
  }, [loadAppData]);

  const updateProfile = useCallback(async (patch) => {
    try {
      const updated = await api.updateProfile(patch);
      setUser(u => ({ ...u, ...updated }));
      toast('Profile saved');
    } catch (err) {
      toast({ title: 'Failed to update profile', body: err.message, tone: 'bad' });
    }
  }, [toast]);

  const actions = useMemo(() => ({
    async createTicket(ticketData) {
      try {
        const created = await api.createTicket(ticketData);
        setState(s => ({ ...s, tickets: [created, ...s.tickets] }));
        return created;
      } catch (err) {
        toast({ title: 'Failed to create request', body: err.message, tone: 'bad' });
        throw err;
      }
    },

    async addMessage(ticketId, messageData) {
      try {
        const updated = await api.addMessage(ticketId, messageData);
        setState(s => ({
          ...s,
          tickets: s.tickets.map(t => t.id === ticketId ? updated : t)
        }));
        return updated;
      } catch (err) {
        toast({ title: 'Failed to send reply', body: err.message, tone: 'bad' });
        throw err;
      }
    },

    async updateTicket(ticketId, patch, note) {
      try {
        const updated = await api.updateTicket(ticketId, { ...patch, note });
        setState(s => ({
          ...s,
          tickets: s.tickets.map(t => t.id === ticketId ? updated : t)
        }));
        return updated;
      } catch (err) {
        toast({ title: 'Failed to update request', body: err.message, tone: 'bad' });
        throw err;
      }
    },

    async bulkUpdate(ids, patch) {
      try {
        await api.bulkUpdate(ids, patch);
        // Refresh tickets
        const tickets = await api.getTickets();
        setState(s => ({ ...s, tickets }));
        toast({ title: `Updated ${ids.length} requests` });
      } catch (err) {
        toast({ title: 'Bulk update failed', body: err.message, tone: 'bad' });
      }
    },

    async rateTicket(ticketId, rating, comment) {
      try {
        const updated = await api.rateTicket(ticketId, rating, comment);
        setState(s => ({
          ...s,
          tickets: s.tickets.map(t => t.id === ticketId ? updated : t)
        }));
      } catch (err) {
        toast({ title: 'Failed to submit rating', body: err.message, tone: 'bad' });
      }
    },

    async markRead(id) {
      try {
        await api.markNotificationRead(id);
        setState(s => ({
          ...s,
          notifications: s.notifications.map(n =>
            (id === 'all' || n.id === id) ? { ...n, read: true } : n
          )
        }));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    },

    async voteKb(id, up) {
      try {
        const res = await api.voteKB(id, up);
        setState(s => ({
          ...s,
          kbVotes: { ...s.kbVotes, [id]: res.userVote }
        }));
      } catch (err) {
        toast({ title: 'Failed to vote', body: err.message, tone: 'bad' });
      }
    },

    async toggleEvent(id) {
      try {
        const res = await api.toggleEvent(id);
        setState(s => ({
          ...s,
          eventRegs: res.registered
            ? [...s.eventRegs, id]
            : s.eventRegs.filter(x => x !== id),
          events: s.events.map(e => e.id === id ? { ...e, registered: res.registered_count } : e)
        }));
      } catch (err) {
        toast({ title: 'Failed to update registration', body: err.message, tone: 'bad' });
      }
    },

    async reportLF(item) {
      try {
        const created = await api.reportLF(item);
        setState(s => ({ ...s, lostFound: [created, ...s.lostFound] }));
        return created;
      } catch (err) {
        toast({ title: 'Failed to report item', body: err.message, tone: 'bad' });
        throw err;
      }
    },

    async claimLF(id) {
      try {
        const updated = await api.claimLF(id);
        setState(s => ({
          ...s,
          lostFound: s.lostFound.map(x => x.id === id ? updated : x)
        }));
      } catch (err) {
        toast({ title: 'Failed to claim item', body: err.message, tone: 'bad' });
      }
    },

    async payFees(ids, method) {
      try {
        const receipt = await api.payFees(ids, method);
        setState(s => ({
          ...s,
          fees: s.fees.map(f => ids.includes(f.id) ? { ...f, status: 'paid', paidOn: 'Today' } : f),
          receipts: [receipt, ...s.receipts]
        }));
        return receipt;
      } catch (err) {
        toast({ title: 'Payment failed', body: err.message, tone: 'bad' });
        throw err;
      }
    },

    async postAnnouncement(a) {
      try {
        const created = await api.postAnnouncement(a);
        setState(s => ({ ...s, announcements: [created, ...s.announcements] }));
        return created;
      } catch (err) {
        toast({ title: 'Failed to publish announcement', body: err.message, tone: 'bad' });
        throw err;
      }
    },

    async deleteAnnouncement(id) {
      try {
        await api.deleteAnnouncement(id);
        setState(s => ({ ...s, announcements: s.announcements.filter(a => a.id !== id) }));
      } catch (err) {
        toast({ title: 'Failed to delete announcement', body: err.message, tone: 'bad' });
      }
    },

    async toggleChecklist(k) {
      try {
        const res = await api.toggleChecklist(k);
        setState(s => ({ ...s, checklist: { ...s.checklist, [k]: res.done } }));
      } catch (err) {
        console.error('Failed to toggle checklist:', err);
      }
    },

    async addCanned(c) {
      try {
        const created = await api.addCannedReply(c);
        setState(s => ({ ...s, cannedReplies: [...s.cannedReplies, created] }));
      } catch (err) {
        toast({ title: 'Failed to add reply', body: err.message, tone: 'bad' });
      }
    },

    async removeCanned(id) {
      try {
        await api.deleteCannedReply(id);
        setState(s => ({ ...s, cannedReplies: s.cannedReplies.filter(c => c.id !== id) }));
      } catch (err) {
        toast({ title: 'Failed to remove reply', body: err.message, tone: 'bad' });
      }
    },

    async saveView(v) {
      try {
        const created = await api.saveView(v);
        setState(s => ({ ...s, savedViews: [...s.savedViews, created] }));
      } catch (err) {
        toast({ title: 'Failed to save view', body: err.message, tone: 'bad' });
      }
    },

    async removeView(id) {
      try {
        await api.deleteSavedView(id);
        setState(s => ({ ...s, savedViews: s.savedViews.filter(v => v.id !== id) }));
      } catch (err) {
        toast({ title: 'Failed to remove view', body: err.message, tone: 'bad' });
      }
    },

    async resetDemo() {
      await loadAppData();
      toast('Refreshed data from backend');
    },
  }), [toast, loadAppData]);

  const value = useMemo(() => ({
    ...state,
    user,
    login,
    logout,
    updateProfile,
    loadAppData,
    toast,
    toasts,
    dismissToast,
    actions
  }), [state, user, login, logout, updateProfile, loadAppData, toast, toasts, dismissToast, actions]);

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);

export function useNow(ms = 30000) {
  const [n, setN] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setN(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return n;
}
