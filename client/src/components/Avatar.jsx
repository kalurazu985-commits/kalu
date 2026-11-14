export default function Avatar({ name = '?', color = '#7c5cff', size = 36, dot }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="grid place-items-center rounded-full font-semibold text-white w-full h-full" style={{ background: color, fontSize: size * 0.4 }}>
        {name.slice(0, 1).toUpperCase()}
      </span>
      {dot !== undefined && <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-[#12151c] ${dot ? 'bg-emerald-400' : 'bg-zinc-600'}`} />}
    </span>
  );
}
