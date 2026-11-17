import { useState } from 'react';
import { api } from '../socket';
import DiamondLogo from './DiamondLogo';

const COLORS = ['#7c5cff', '#22d3ee', '#f43f5e', '#f59e0b', '#10b981', '#ec4899'];
export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ username: '', email: '', password: '', color: COLORS[0] });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { onAuth(await api(`/auth/${mode === 'login' ? 'login' : 'signup'}`, null, f)); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const inp = 'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-violet-400 placeholder:text-zinc-500';
  return (
    <div className="h-full grid place-items-center p-4 bg-[radial-gradient(circle_at_20%_10%,#7c5cff30,transparent_45%),radial-gradient(circle_at_90%_90%,#22d3ee22,transparent_40%)]">
      <form onSubmit={submit} className="glass w-full max-w-sm rounded-3xl border border-white/10 p-7 space-y-4">
        <div className="flex items-center gap-3"><DiamondLogo size={48} /><div><h1 className="text-2xl font-extrabold">Diamond Messenger</h1><p className="text-sm text-zinc-400">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p></div></div>
        {mode === 'signup' && <input className={inp} placeholder="Username" value={f.username} onChange={set('username')} required />}
        <input className={inp} type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className={inp} type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required minLength={6} />
        {mode === 'signup' && (
          <div className="flex items-center gap-2"><span className="text-sm text-zinc-400 mr-1">Avatar color</span>
            {COLORS.map((c) => <button type="button" key={c} onClick={() => setF({ ...f, color: c })} aria-label={c}
              className={`w-7 h-7 rounded-full ${f.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161a24]' : ''}`} style={{ background: c }} />)}
          </div>)}
        {err && <p className="text-sm text-rose-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 text-black disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }} className="w-full text-sm text-zinc-400 hover:text-white">
          {mode === 'login' ? 'New to Diamond Messenger? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
