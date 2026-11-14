import { useState } from 'react';
import { Copy, X, Check } from 'lucide-react';
import { api } from '../socket';

export default function RoomModal({ token, onClose, onDone }) {
  const [tab, setTab] = useState('create');
  const [val, setVal] = useState(''); const [err, setErr] = useState(''); const [made, setMade] = useState(null); const [copied, setCopied] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (tab === 'create') { const r = await api('/rooms', token, { name: val }); setMade(r); onDone(r); }
      else { const r = await api('/rooms/join', token, { code: val }); onDone(r); onClose(); }
    } catch (x) { setErr(x.message); }
  };
  const link = made ? `${location.origin}/?join=${made.code}` : '';
  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass pop w-full max-w-sm rounded-3xl border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold">{made ? 'Room ready' : 'Rooms'}</h2><button onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        {made ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">Share this code or link with friends to invite them to <b className="text-white">{made.name}</b>.</p>
            <div className="text-center text-4xl font-extrabold tracking-[.3em] py-3 rounded-xl bg-white/5">{made.code}</div>
            <button onClick={copy} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 bg-violet-500 font-semibold">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? 'Copied' : 'Copy invite link'}</button>
            <button onClick={onClose} className="w-full text-sm text-zinc-400">Open room</button>
          </div>
        ) : (
          <form onSubmit={go} className="space-y-3">
            <div className="flex rounded-xl bg-white/5 p-1">{['create', 'join'].map((t) => <button type="button" key={t} onClick={() => { setTab(t); setVal(''); setErr(''); }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === t ? 'bg-violet-500' : 'text-zinc-400'}`}>{t === 'create' ? 'Create room' : 'Join with code'}</button>)}</div>
            <input autoFocus value={val} onChange={(e) => setVal(tab === 'join' ? e.target.value.toUpperCase().slice(0, 6) : e.target.value)} maxLength={tab === 'join' ? 6 : 40}
              placeholder={tab === 'create' ? 'Room name' : '6-character code'} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-violet-400" required />
            {err && <p className="text-sm text-rose-400">{err}</p>}
            <button className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 text-black">{tab === 'create' ? 'Create room' : 'Join room'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
