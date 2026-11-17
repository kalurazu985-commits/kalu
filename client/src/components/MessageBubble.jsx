import { memo, useMemo, useRef, useState } from 'react';
import { Ban, Check, CheckCheck, Clock, Pause, Play, Reply, SmilePlus, Trash2 } from 'lucide-react';
import Avatar from './Avatar';

const EMOJI = ['👍', '❤️', '😂', '🔥', '😮'];

function Voice({ src, id, dur = 1 }) {
  const a = useRef(); const [p, setP] = useState(0); const [pl, setPl] = useState(false);
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => 6 + ((String(id).charCodeAt(i % String(id).length) * (i + 7)) % 18)), [id]);
  return (
    <div className="flex items-center gap-2 w-56">
      <audio ref={a} src={src} onTimeUpdate={(e) => setP(Math.min(1, e.target.currentTime / dur))} onEnded={() => { setPl(false); setP(0); }} />
      <button onClick={() => { pl ? a.current.pause() : a.current.play(); setPl(!pl); }} aria-label={pl ? 'Pause' : 'Play'} className="grid place-items-center w-9 h-9 rounded-full bg-white/20 shrink-0">{pl ? <Pause size={16} /> : <Play size={16} />}</button>
      <div className="flex items-center gap-[2px] h-6 flex-1">{bars.map((h, i) => <i key={i} style={{ height: h }} className={`w-[3px] rounded ${i / bars.length < p ? 'bg-white' : 'bg-white/35'}`} />)}</div>
      <span className="text-xs tabular-nums opacity-80">{dur}s</span>
    </div>
  );
}

function MessageBubble({ m, mine, me, onReply, onReact, onImage, onDelete }) {
  const [open, setOpen] = useState(false); const x0 = useRef(0);
  const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const reactions = Object.entries(m.reactions || {});
  if (m.deleted) return (
    <div className={`flex gap-2 px-3 py-0.5 ${mine ? 'flex-row-reverse' : ''}`}>
      {!mine && <Avatar name={m.name} color={m.color} size={32} />}
      <div className="max-w-[78%] md:max-w-[60%] rounded-2xl border border-white/10 px-3 py-2 text-sm italic text-zinc-400 flex items-center gap-1.5">
        <Ban size={14} />{mine ? 'You deleted this message' : 'This message was deleted'}
      </div>
    </div>
  );
  return (
    <div className={`group flex gap-2 px-3 py-0.5 ${mine ? 'flex-row-reverse' : ''}`}
      onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (Math.abs(e.changedTouches[0].clientX - x0.current) > 70) onReply(m); }}>
      {!mine && <Avatar name={m.name} color={m.color} size={32} />}
      <div className={`max-w-[78%] md:max-w-[60%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="relative">
          <div onClick={() => setOpen(!open)} className={`rounded-2xl px-3 py-2 ${mine ? 'bg-gradient-to-br from-violet-500 to-indigo-500 rounded-br-md' : 'bg-[#1c2130] rounded-bl-md'}`}>
            {!mine && <div className="text-xs font-semibold mb-0.5" style={{ color: m.color }}>{m.name}</div>}
            {m.replyTo && <div className="mb-1 rounded-lg border-l-2 border-white/60 bg-black/20 px-2 py-1 text-xs"><b>{m.replyTo.name}</b><div className="truncate opacity-80">{m.replyTo.text}</div></div>}
            {m.type === 'image' && <img src={m.media} alt="Shared" onClick={(e) => { e.stopPropagation(); onImage(m.media); }} className="rounded-lg max-h-72 cursor-zoom-in" />}
            {m.type === 'audio' && <Voice src={m.media} id={m._id} dur={m.duration} />}
            {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
            <div className="flex justify-end items-center gap-1 text-[10px] opacity-70 mt-0.5">{time}
              {mine && (m.status === 'sending' ? <Clock size={11} /> : <CheckCheck size={12} />)}</div>
          </div>
          <div className={`absolute top-0 ${mine ? 'right-full mr-1' : 'left-full ml-1'} ${open ? 'flex' : 'hidden group-hover:flex'} pop items-center gap-0.5 rounded-full glass border border-white/10 px-1 py-0.5 z-10`}>
            {EMOJI.map((e) => <button key={e} onClick={() => { onReact(m._id, e); setOpen(false); }} className="px-1 hover:scale-125 transition-transform">{e}</button>)}
            <button onClick={() => { onReply(m); setOpen(false); }} aria-label="Reply" className="px-1 text-zinc-300"><Reply size={16} /></button>
            {mine && m.status !== 'sending' && <button onClick={() => { onDelete(m); setOpen(false); }} aria-label="Delete message" className="px-1 text-rose-400 hover:text-rose-300"><Trash2 size={16} /></button>}
          </div>
        </div>
        {reactions.length > 0 && <div className="flex gap-1 mt-1 flex-wrap">{reactions.map(([e, u]) => (
          <button key={e} onClick={() => onReact(m._id, e)} className={`text-xs rounded-full px-2 py-0.5 border ${u.includes(me) ? 'border-violet-400 bg-violet-500/20' : 'border-white/10 bg-white/5'}`}>{e} {u.length}</button>))}</div>}
      </div>
    </div>
  );
}
export default memo(MessageBubble);
