import { useEffect, useState } from 'react';
import { api, connect, socket } from './socket';
import LoadingIntro from './components/LoadingIntro';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatRoom from './components/ChatRoom';
import RoomModal from './components/RoomModal';
import KaluLogo from './components/KaluLogo';

export default function App() {
  const [intro, setIntro] = useState(true);
  const [auth, setAuth] = useState(() => { try { return JSON.parse(localStorage.getItem('kalu')); } catch { return null; } });
  const [rooms, setRooms] = useState([]); const [active, setActive] = useState(null);
  const [online, setOnline] = useState(new Set()); const [modal, setModal] = useState(false);

  const login = (a) => { localStorage.setItem('kalu', JSON.stringify(a)); setAuth(a); };
  const logout = () => { localStorage.removeItem('kalu'); socket.disconnect(); setAuth(null); setRooms([]); setActive(null); };
  const upsert = (r) => setRooms((p) => [r, ...p.filter((x) => x._id !== r._id)]);

  useEffect(() => {
    if (!auth) return;
    connect(auth.token);
    const code = new URLSearchParams(location.search).get('join');
    api('/rooms', auth.token).then(async (l) => {
      setRooms(l);
      if (code) { try { const r = await api('/rooms/join', auth.token, { code }); upsert(r); setActive(r._id); socket.emit('room:join', r._id); } catch {} history.replaceState({}, '', '/'); }
    }).catch(logout);
    const all = (l) => setOnline(new Set(l));
    const pres = ({ userId, online: o }) => setOnline((p) => { const n = new Set(p); o ? n.add(userId) : n.delete(userId); return n; });
    socket.on('presence:all', all); socket.on('presence', pres); socket.on('room:updated', upsert);
    return () => { socket.off('presence:all', all); socket.off('presence', pres); socket.off('room:updated', upsert); socket.disconnect(); };
  }, [auth]);

  if (intro) return <LoadingIntro onDone={() => setIntro(false)} />;
  if (!auth) return <Auth onAuth={login} />;
  const me = { ...auth.user, token: auth.token };
  const room = rooms.find((r) => r._id === active);

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      <div className={`${room ? 'hidden md:block' : 'block'} w-full md:w-auto h-full`}>
        <Sidebar me={me} rooms={rooms} active={active} online={online} onSelect={setActive} onAdd={() => setModal(true)} onLogout={logout} />
      </div>
      <main className={`${room ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
        {room ? <ChatRoom key={room._id} room={room} me={me} online={online} onBack={() => setActive(null)} />
          : <div className="m-auto text-center text-zinc-500"><div className="grid place-items-center mb-3"><KaluLogo size={72} /></div>Pick a room to start chatting</div>}
      </main>
      {modal && <RoomModal token={auth.token} onClose={() => setModal(false)} onDone={(r) => { upsert(r); setActive(r._id); socket.emit('room:join', r._id); }} />}
    </div>
  );
}
