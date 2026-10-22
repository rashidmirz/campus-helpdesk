import { http, setToken, removeToken, getToken, setOnUnauthorized } from './http';

export { setToken, removeToken, getToken, setOnUnauthorized };

export const api = {
  // Auth
  login: async (login, password) => {
    const res = await http.post('/auth/login', { login, password });
    if (res?.token) {
      setToken(res.token);
    }
    return res;
  },
  getMe: () => http.get('/me'),
  updateProfile: (patch) => http.patch('/me', patch),
  changePassword: (old_password, new_password) => http.post('/auth/change-password', { old_password, new_password }),
  forgotPassword: (email) => http.post('/auth/forgot-password', { email }),

  // Tickets
  getTickets: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== 'all') q.set(k, v);
    });
    const qs = q.toString();
    return http.get(`/tickets${qs ? `?${qs}` : ''}`);
  },
  getTicket: (id) => http.get(`/tickets/${id}`),
  createTicket: (data) => http.post('/tickets', data),
  updateTicket: (id, patch) => http.patch(`/tickets/${id}`, patch),
  addMessage: (id, messageData) => http.post(`/tickets/${id}/messages`, messageData),
  uploadAttachment: (ticketId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.upload(`/tickets/${ticketId}/attachments`, fd);
  },
  rateTicket: (id, rating, comment) => http.post(`/tickets/${id}/rating`, { rating, comment }),
  bulkUpdate: (ids, patch) => http.post('/tickets/bulk', { ids, patch }),

  // Public Tracker
  trackTicket: (id) => http.get(`/public/track/${id}`),

  // Knowledge Base
  getKB: (params = {}) => {
    const q = new URLSearchParams();
    if (params.q) q.set('q', params.q);
    if (params.category && params.category !== 'all') q.set('category', params.category);
    const qs = q.toString();
    return http.get(`/kb${qs ? `?${qs}` : ''}`);
  },
  getKBArticle: (slug) => http.get(`/kb/${slug}`),
  suggestKB: (q) => http.get(`/kb/suggest?q=${encodeURIComponent(q)}`),
  voteKB: (id, up) => http.post(`/kb/${id}/vote`, { up }),

  // Notifications
  getNotifications: () => http.get('/notifications'),
  markNotificationRead: (id) => http.post('/notifications/read', { id }),

  // Events
  getEvents: () => http.get('/events'),
  toggleEvent: (id) => http.post(`/events/${id}/register`, {}),

  // Lost & Found
  getLostFound: () => http.get('/lost-found'),
  reportLF: (data) => http.post('/lost-found', data),
  claimLF: (id) => http.post(`/lost-found/${id}/claim`, {}),

  // Fees
  getFees: () => http.get('/fees'),
  payFees: (ids, method) => http.post('/fees/pay', { ids, method }),
  getReceipts: () => http.get('/fees/receipts'),

  // Exams
  getExams: () => http.get('/exams'),

  // Documents
  getDocuments: () => http.get('/documents'),
  requestDocument: (data) => http.post('/documents', data),

  // Announcements
  getAnnouncements: () => http.get('/announcements'),
  postAnnouncement: (data) => http.post('/announcements', data),
  deleteAnnouncement: (id) => http.delete(`/announcements/${id}`),

  // People & Admin
  getPeople: (type = 'students', dept = 'all', q = '') => {
    const p = new URLSearchParams({ type });
    if (dept && dept !== 'all') p.set('dept', dept);
    if (q) p.set('q', q);
    return http.get(`/people?${p.toString()}`);
  },
  getCannedReplies: () => http.get('/canned-replies'),
  addCannedReply: (data) => http.post('/canned-replies', data),
  deleteCannedReply: (id) => http.delete(`/canned-replies/${id}`),

  getSavedViews: () => http.get('/saved-views'),
  saveView: (data) => http.post('/saved-views', data),
  deleteSavedView: (id) => http.delete(`/saved-views/${id}`),

  getChecklist: () => http.get('/checklist'),
  toggleChecklist: (key) => http.post('/checklist/toggle', { key }),

  // Analytics
  getAnalyticsOverview: () => http.get('/analytics/overview'),

  // Assistant
  askAssistant: (question) => http.post('/assistant/ask', { question })
};

// Keep backwards-compatible bundle exports if needed
export function loadBundle() {
  return {
    tickets: [], notifications: [], kbVotes: {}, eventRegs: [],
    lostFound: [], fees: [], receipts: [], announcements: [],
    users: {}, checklist: {}, cannedReplies: [], savedViews: [],
  };
}
export function freshBundle() {
  return loadBundle();
}
export function saveBundle() {}
export function clearBundle() {
  removeToken();
}
