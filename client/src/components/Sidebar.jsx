import { LogOut, Plus } from 'lucide-react';
import KaluLogo from './KaluLogo';
import Avatar from './Avatar';

export default function Sidebar({ me, rooms, active, online, onSelect, onAdd, onLogout }) {
  return (
    <aside className="flex flex-col h-full w-full md:w-80 bg-[#12151c] md:border-r border-white/5">
      <div className="flex items-center justify-between p-4"><div className="flex items-center gap-2"><KaluLogo size={34} /><span className="text-xl font-extrabold">Kalu</span></div>
        <button onClick={onAdd} aria-label="Create or join a room" className="grid place-items-center w-9 h-9 rounded-xl bg-violet-500 hover:bg-violet-400"><Plus size={20} /></button></div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {rooms.length === 0 && <p className="text-sm text-zinc-500 p-4">No rooms yet. Create one or join with a 6-character code.</p>}
        {rooms.map((r) => {
          const on = r.members.filter((m) => online.has(m._id)).length;
          return (
            <button key={r._id} onClick={() => onSelect(r._id)} className={`w-full flex items-center gap-3 rounded-xl p-3 text-left ${active === r._id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-400/30 font-bold">{r.name.slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0"><span className="block font-medium truncate">{r.name}</span><span className="block text-xs text-zinc-400">{r.members.length} members, {on} online</span></span>
            </button>);
        })}
      </div>
      <div className="flex items-center gap-3 p-4 border-t border-white/5">
        <Avatar name={me.username} color={me.color} dot={true} /><div className="flex-1 min-w-0"><div className="font-medium truncate">{me.username}</div><div className="text-xs text-emerald-400">Online</div></div>
        <button onClick={onLogout} aria-label="Sign out" className="text-zinc-400 hover:text-white"><LogOut size={19} /></button>
      </div>
    </aside>
  );
}
