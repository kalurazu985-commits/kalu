import { useEffect, useState } from 'react';
export default function LoadingIntro({ onDone }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setOut(true), 1150), b = setTimeout(onDone, 1550);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b0d12]" style={out ? { animation: 'fadeOut .4s forwards' } : {}}>
      <div className="glow flex text-7xl font-extrabold tracking-tight">
        {'Kalu'.split('').map((c, i) => <span key={i} className="letter" style={{ animationDelay: `${i * 140}ms` }}>{c}</span>)}
      </div>
    </div>
  );
}
