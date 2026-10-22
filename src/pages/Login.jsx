import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, GraduationCap, Presentation, ShieldCheck, Mail, Lock, KeyRound, CheckCircle2, ArrowRight, Wifi, AlertCircle } from 'lucide-react';
import { Link } from '../lib/router';
import { useStore } from '../store/store';
import { api } from '../services/api';
import { Button, Field, Input, Modal, Avatar, Badge, Tabs } from '../components/ui';
import { LogoMark, Wordmark } from '../components/layout/Logo';

const DEMO_ACCOUNTS = {
  students: [
    { id: 'STU-8842', name: 'Aarav Sharma', email: 'aarav.sharma@silveroak.edu.in', pw: 'Aarav@2026', title: 'B.Tech CSE · 6th sem' },
    { id: 'STU-8843', name: 'Diya Patel', email: 'diya.patel@silveroak.edu.in', pw: 'Diya@2026', title: 'B.Tech ECE · 4th sem' },
    { id: 'STU-8844', name: 'Rohan Mehta', email: 'rohan.mehta@silveroak.edu.in', pw: 'Rohan@2026', title: 'B.Tech ME · 2nd sem' },
    { id: 'STU-8845', name: 'Ananya Iyer', email: 'ananya.iyer@silveroak.edu.in', pw: 'Ananya@2026', title: 'B.Tech Civil · 6th sem' },
    { id: 'STU-8846', name: 'Kabir Singh', email: 'kabir.singh@silveroak.edu.in', pw: 'Kabir@2026', title: 'MBA · 3rd sem' },
  ],
  faculty: [
    { id: 'FAC-1044', name: 'Dr. Priya Nair', email: 'priya.nair@silveroak.edu.in', pw: 'Priya@2026', title: 'Assoc. Professor · CSE' },
    { id: 'FAC-1045', name: 'Dr. Rajesh Kulkarni', email: 'rajesh.kulkarni@silveroak.edu.in', pw: 'Rajesh@2026', title: 'Professor · ECE' },
    { id: 'FAC-1046', name: 'Dr. Meera Joshi', email: 'meera.joshi@silveroak.edu.in', pw: 'Meera@2026', title: 'Assoc. Professor · MBA' },
    { id: 'FAC-1047', name: 'Prof. Arvind Desai', email: 'arvind.desai@silveroak.edu.in', pw: 'Arvind@2026', title: 'Professor · ME' },
  ],
  admin: [
    { id: 'ADM-001', name: 'Vikram Anand', email: 'vikram.anand@silveroak.edu.in', pw: 'Admin@2026', title: 'Helpdesk Lead · Dean’s Office' },
    { id: 'ADM-002', name: 'Neha Kapoor', email: 'neha.kapoor@silveroak.edu.in', pw: 'Admin@2027', title: 'Helpdesk Operations Lead' },
  ]
};

function ForgotModal({ open, onClose, defaultEmail }) {
  const [step, setStep] = useState(0);
  const [val, setVal] = useState(defaultEmail || '');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setStep(0); setErr(''); setCode(''); onClose(); };

  const handleSend = async () => {
    if (!/\S+@\S+\.\S+/.test(val)) return setErr('Enter a valid university email address.');
    setBusy(true);
    setErr('');
    try {
      await api.forgotPassword(val);
      setStep(1);
    } catch (e) {
      setErr(e.message || 'Failed to send reset link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={reset} size="sm" title={step === 2 ? 'Password updated' : 'Reset your password'} description={step === 0 ? 'We will email a 6-digit code to your registered address.' : step === 1 ? `Enter the code we sent to ${val}.` : undefined}
      footer={step === 2 ? <Button onClick={reset}>Back to sign in</Button> : <><Button variant="ghost" onClick={reset}>Cancel</Button><Button loading={busy} onClick={() => { if (step === 0) { handleSend(); } else { if (code.length !== 6) return setErr('The code has 6 digits.'); setErr(''); setStep(2); } }}>{step === 0 ? 'Send code' : 'Verify and continue'}</Button></>}>
      {step === 0 && <Field label="University email" error={err} htmlFor="fe"><Input id="fe" icon={Mail} value={val} onChange={(e) => setVal(e.target.value)} placeholder="name@silveroak.edu.in" /></Field>}
      {step === 1 && <Field label="6-digit code" error={err} hint="Demo: any 6 digits work." htmlFor="fc"><Input id="fc" icon={KeyRound} inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="font-mono tracking-[0.4em]" placeholder="••••••" /></Field>}
      {step === 2 && <div className="flex flex-col items-center py-4 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft text-ok-fg"><CheckCircle2 className="h-6 w-6" /></span><p className="mt-3 text-sm text-ink-2">You can now sign in with your new password. Other devices have been signed out.</p></div>}
    </Modal>
  );
}

export function Login() {
  const { login, toast } = useStore();
  const [loginId, setLoginId] = useState('STU-8842');
  const [pw, setPw] = useState('Aarav@2026');
  const [show, setShow] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [demoTab, setDemoTab] = useState('students');

  const fillCreds = (account) => {
    setLoginId(account.id);
    setPw(account.pw);
    setErrorMsg('');
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!loginId.trim()) {
      setErrorMsg('Enter your User ID or email.');
      return;
    }
    if (!pw) {
      setErrorMsg('Enter your password.');
      return;
    }

    setErrorMsg('');
    setBusy(true);

    try {
      const loggedUser = await login(loginId.trim(), pw);
      toast({
        title: `Welcome back, ${loggedUser.name.split(' ')[0]}`,
        body: `Signed in as ${loggedUser.role}.`
      });
    } catch (err) {
      setErrorMsg(err.message === 'Invalid ID or password' ? 'Invalid ID or password' : (err.message || 'Invalid ID or password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between"><Link to="/" className="flex items-center gap-3"><LogoMark size={34} /><Wordmark /></Link><Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" />Back to site</Link></div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          <h1 className="font-display text-[32px] leading-tight">Sign in to the helpdesk</h1>
          <p className="mt-2 text-ink-2">Use your Silver Oak University ID or email address.</p>

          {errorMsg && (
            <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-bad-soft p-3 text-sm text-bad-fg">
              <AlertCircle className="h-4 w-4 shrink-0 text-bad" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <Field label="User ID or university email" htmlFor="lid">
              <Input id="lid" icon={Mail} autoComplete="username" value={loginId} onChange={(e) => { setLoginId(e.target.value); setErrorMsg(''); }} placeholder="STU-8842 or name@silveroak.edu.in" />
            </Field>

            <Field label="Password" htmlFor="pw">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input id="pw" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setErrorMsg(''); }} placeholder="Enter password" className="field px-9" />
                <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-3 hover:text-ink">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-2">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-[rgb(var(--ac))]" />
                Remember me
              </label>
              <button type="button" onClick={() => setForgot(true)} className="font-medium text-accent-softfg hover:underline">Forgot password?</button>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={busy} iconRight={ArrowRight}>Sign in</Button>
          </form>

          {/* Project Fair Demo Accounts Helper */}
          <div className="mt-7 rounded-xl border border-line bg-surface-2 p-3.5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">Project Fair Demo Logins</span>
              <span className="text-[11px] text-ink-3">Click to autofill</span>
            </div>

            <Tabs
              value={demoTab}
              onChange={setDemoTab}
              className="mb-2.5"
              tabs={[
                { value: 'students', label: 'Students', count: DEMO_ACCOUNTS.students.length },
                { value: 'faculty', label: 'Faculty', count: DEMO_ACCOUNTS.faculty.length },
                { value: 'admin', label: 'Admins', count: DEMO_ACCOUNTS.admin.length },
              ]}
            />

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS[demoTab].map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => fillCreds(acc)}
                  className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-left transition hover:border-accent hover:bg-accent-soft"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{acc.name} <span className="font-mono text-ink-3">({acc.id})</span></p>
                    <p className="truncate text-[11px] text-ink-3">{acc.title} · Password: <span className="font-mono font-medium text-ink-2">{acc.pw}</span></p>
                  </div>
                  <Badge tone="accent" className="ml-2 shrink-0 text-[10px]">Use</Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-sb-bg text-sb-fg lg:block" style={{ background: 'rgb(var(--ac-900))' }}>
        <div className="dotgrid absolute inset-0 opacity-30 invert" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-14 text-white">
          <Badge className="w-fit !bg-white/10 !text-white"><Wifi className="h-3.5 w-3.5" />Connected to FastAPI Backend · SQLite</Badge>
          <div className="mx-auto w-full max-w-sm rotate-[-2deg] rounded-2xl bg-white/10 p-5 backdrop-blur-sm ring-1 ring-white/20">
            <div className="flex items-center justify-between text-sm"><span className="font-mono text-white/70">HD-2041</span><span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">In progress</span></div>
            <p className="mt-2 font-medium">Wi-Fi keeps dropping in Block B</p>
            <div className="mt-4 flex items-center gap-1.5">{[1, 1, 1, 0].map((d, i) => <span key={i} className={'h-1.5 flex-1 rounded-full ' + (d ? 'bg-white' : 'bg-white/25')} />)}</div>
            <p className="mt-3 text-xs text-white/70">Meera replied · 9h left on target</p>
          </div>
          <div>
            <p className="font-display text-[38px] leading-[1.1] max-w-[18ch]">“Every request backed by real database records and SLAs.”</p>
            <p className="mt-5 text-white/70">Silver Oak University Helpdesk v2</p>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
              {[['1h 40m', 'median first reply'], ['94%', 'resolved on SLA'], ['4.6 / 5', 'average rating']].map(([v, l]) => <div key={l}><p className="num font-display text-2xl">{v}</p><p className="mt-1 text-sm text-white/65">{l}</p></div>)}
            </div>
          </div>
        </div>
      </aside>

      <ForgotModal open={forgot} onClose={() => setForgot(false)} defaultEmail={loginId.includes('@') ? loginId : ''} />
    </div>
  );
}
