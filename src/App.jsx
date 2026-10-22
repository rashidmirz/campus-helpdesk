import { useEffect } from 'react';
import { useRoute, navigate } from './lib/router';
import { useStore } from './store/store';
import { AppShell } from './components/layout/AppShell';
import { Toaster } from './components/ui';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tickets } from './pages/Tickets';
import { NewTicket } from './pages/NewTicket';
import { TicketDetail } from './pages/TicketDetail';
import { Knowledge, Article } from './pages/Knowledge';
import { Assistant } from './pages/Assistant';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Exams, Fees, Documents, LostFound, Events } from './pages/Campus';
import { People, Announcements } from './pages/Admin';
import { EmptyState, Button } from './components/ui';

function AppRoutes({ segments }) {
  const { user } = useStore(); const [, a, b] = segments; const admin = user.role === 'admin';
  switch (a) {
    case undefined: return <Dashboard />;
    case 'tickets': return b === 'new' ? (admin ? <Tickets /> : <NewTicket />) : b ? <TicketDetail id={b} /> : <Tickets />;
    case 'knowledge': return b ? <Article slug={b} /> : <Knowledge />;
    case 'assistant': return <Assistant />;
    case 'analytics': return admin ? <Analytics /> : <NotFound />;
    case 'people': return admin ? <People /> : <NotFound />;
    case 'announcements': return admin ? <Announcements /> : <NotFound />;
    case 'exams': return <Exams />;
    case 'fees': return <Fees />;
    case 'documents': return <Documents />;
    case 'lost-found': return <LostFound />;
    case 'events': return <Events />;
    case 'settings': return <Settings />;
    default: return <NotFound />;
  }
}
const NotFound = () => <EmptyState title="That page does not exist" body="It may have moved, or your role does not include it." action={<Button onClick={() => navigate('/app')}>Back to overview</Button>} />;

export function App() {
  const { path, segments } = useRoute(); const { user, toasts, dismissToast } = useStore();
  useEffect(() => { if (segments[0] === 'app' && !user) navigate('/login', { replace: true }); if (segments[0] === 'login' && user) navigate('/app', { replace: true }); }, [segments, user]);
  if (segments[0] === 'app') return user ? <AppShell><AppRoutes segments={segments} /></AppShell> : null;
  return <>{segments[0] === 'login' ? <Login /> : <Landing />}<Toaster toasts={toasts} dismiss={dismissToast} /></>;
}
