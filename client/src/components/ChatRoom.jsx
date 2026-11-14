import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Link2, Send, X } from 'lucide-react';
import { api, socket } from '../socket';
import MessageBubble from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import Avatar from './Avatar';

export default function ChatRoom({ room, me, online, onBack }) {
  const id = room._id;
  const [msgs, setMsgs] = useState([]); const [text, setText] = useState(''); const [reply, setReply] = useState(null);
  const [typing, setTyping] = useState({}); const [light, setLight] = useState(null); const [more, setMore] = useState(true); const [copied, setCopied] = useState(false);
  const box = useRef(), end = useRef(), stick = useRef(true), lastT = useRef(0), busy = useRef(false);

  useEffect(() => {
    setMsgs([]); setMore(true); setReply(null); setTyping({}); stick.current = true;
    api(`/rooms/${id}/messages`, me.token).then((l) => { setMsgs(l); setMore(l.length === 40); });
    const onNew = (m) => { if (m.roomId === id) { setMsgs((p) => [...p, m]); setTyping((t) => ({ ...t, [m.sender]: 0 })); } };
    const onReact = ({ id: mid, reactions }) => setMsgs((p) => p.map((m) => (m._id === mid ? { ...m, reactions } : m)));
    const onTyping = (d) => {
      if (d.roomId !== id) return;
      setTyping((t) => ({ ...t, [d.userId]: Date.now(), [`n${d.userId}`]: d.name }));
      setTimeout(() => setTyping((t) => (Date.now() - (t[d.userId] || 0) > 2400 ? { ...t, [d.userId]: 0 } : t)), 2500);
    };
    socket.on('message:new', onNew); socket.on('message:reaction', onReact); socket.on('typing', onTyping);
    return () => { socket.off('message:new', onNew); socket.off('message:reaction', onReact); socket.off('typing', onTyping); };
  }, [id]);

  useEffect(() => { if (stick.current) end.current?.scrollIntoView(); }, [msgs.length]);

  const onScroll = async () => {
    const b = box.current;
    stick.current = b.scrollHeight - b.scrollTop - b.clientHeight < 120;
    if (b.scrollTop < 60 && more && !busy.current && msgs.length) {
      busy.current = true; const prev = b.scrollHeight;
      try {
        const l = await api(`/rooms/${id}/messages?before=${encodeURIComponent(msgs[0].createdAt)}`, me.token);
        setMore(l.length === 40); setMsgs((p) => [...l, ...p]);
        requestAnimationFrame(() => { b.scrollTop = b.scrollHeight - prev; });
      } finally { busy.current = false; }
    }
  };

  const send = (p) => {
    const tempId = 't' + Date.now() + Math.random();
    const base = { roomId: id, replyTo: reply || undefined, ...p };
    stick.current = true;
    setMsgs((x) => [...x, { _id: tempId, sender: me.id, name: me.username, color: me.color, createdAt: new Date().toISOString(), reactions: {}, status: 'sending', ...base }]);
    setReply(null);
    socket.emit('message:send', base, (saved) => setMsgs((x) => x.map((y) => (y._id === tempId ? { ...saved, status: 'sent' } : y))));
  };
  const submit = (e) => { e.preventDefault(); if (!text.trim()) return; send({ type: 'text', text: text.trim() }); setText(''); };
  const onType = (e) => { setText(e.target.value); if (Date.now() - lastT.current > 1500) { lastT.current = Date.now(); socket.emit('typing', id); } };
  const pickImg = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1024 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      send({ type: 'image', media: c.toDataURL('image/jpeg', 0.7) }); URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f); e.target.value = '';
  };
  const startReply = (m) => setReply({ id: m._id, name: m.name, text: m.text || (m.type === 'image' ? 'Photo' : 'Voice note') });
  const react = (mid, emoji) => socket.emit('message:react', { id: mid, emoji });
  const copyInvite = () => { navigator.clipboard.writeText(`${location.origin}/?join=${room.code}`); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const typers = Object.keys(typing).filter((k) => !k.startsWith('n') && typing[k] && k !== me.id).map((k) => typing[`n${k}`]);

  return (
    <section className="flex flex-col h-full w-full min-w-0 bg-[#0b0d12]">
      <header className="glass sticky top-0 z-20 flex items-center gap-3 px-3 py-2 border-b border-white/5 pt-[max(.5rem,env(safe-area-inset-top))]">
        <button onClick={onBack} aria-label="Back to rooms" className="md:hidden p-1"><ArrowLeft size={22} /></button>
        <div className="min-w-0 flex-1"><div className="font-semibold truncate">{room.name}</div>
          <div className="flex -space-x-1 mt-0.5">{room.members.slice(0, 8).map((m) => <Avatar key={m._id} name={m.username} color={m.color} size={20} dot={online.has(m._id)} />)}</div></div>
        <button onClick={copyInvite} className="flex items-center gap-1 text-sm rounded-xl bg-white/10 px-3 py-2"><Link2 size={16} />{copied ? 'Copied' : room.code}</button>
      </header>
      <div ref={box} onScroll={onScroll} className="flex-1 overflow-y-auto py-3 space-y-1">
        {msgs.length === 0 && <p className="text-center text-zinc-500 text-sm mt-10">No messages yet. Say hello.</p>}
        {msgs.map((m) => <MessageBubble key={m._id} m={m} mine={m.sender === me.id} me={me.id} onReply={startReply} onReact={react} onImage={setLight} />)}
        <div ref={end} />
      </div>
      <div className="h-5 px-4 text-xs text-cyan-300">{typers.length > 0 && `${typers.join(', ')} ${typers.length > 1 ? 'are' : 'is'} typing...`}</div>
      <div className="px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        {reply && <div className="flex items-center gap-2 rounded-t-xl bg-white/5 px-3 py-2 text-xs border-l-2 border-violet-400"><div className="flex-1 min-w-0"><b>{reply.name}</b><div className="truncate opacity-70">{reply.text}</div></div><button onClick={() => setReply(null)} aria-label="Cancel reply"><X size={16} /></button></div>}
        <form onSubmit={submit} className="flex items-center gap-1 rounded-2xl bg-[#161a24] border border-white/10 px-2 py-1">
          <label className="p-2 text-zinc-400 hover:text-white cursor-pointer"><ImageIcon size={22} /><input type="file" accept="image/*" hidden onChange={pickImg} /></label>
          <input value={text} onChange={onType} placeholder="Message" className="flex-1 min-w-0 bg-transparent outline-none py-2 text-base" />
          {text.trim() ? <button aria-label="Send" className="p-2 rounded-full bg-violet-500"><Send size={18} /></button>
            : <VoiceRecorder onSend={(media, duration) => send({ type: 'audio', media, duration })} />}
        </form>
      </div>
      {light && <div className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-4" onClick={() => setLight(null)}><img src={light} alt="Preview" className="max-w-full max-h-full rounded-lg" /></div>}
    </section>
  );
}
