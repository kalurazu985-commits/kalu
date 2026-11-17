import { useEffect, useRef, useState } from 'react';
import DiamondLogo from './DiamondLogo';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const SPARKS = [[12, 18, 0], [86, 24, 380], [20, 74, 760], [80, 70, 200], [50, 8, 560], [92, 52, 940], [6, 46, 120]];

export default function LoadingIntro({ onDone }) {
  const [out, setOut] = useState(false);
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };
  const skip = () => { setOut(true); setTimeout(finish, 250); };

  useEffect(() => {
    const quick = reduced();
    const a = setTimeout(() => setOut(true), quick ? 500 : 2300), b = setTimeout(finish, quick ? 800 : 2750);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  const word = (t, base) => t.split('').map((c, i) => <span key={i} className="dm-letter" style={{ animationDelay: `${base + i * 70}ms` }}>{c}</span>);

  return (
    <div className="dm-intro fixed inset-0 z-50 overflow-hidden bg-[#0b0d12]" onClick={skip} role="status" aria-label="Loading Diamond Messenger"
      style={out ? { animation: 'fadeOut .45s forwards' } : {}}>
      <div className="dm-aurora" />
      {SPARKS.map(([x, y, d], i) => <i key={i} className="dm-spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}ms` }} />)}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center select-none">
        <div className="dm-gem">
          <div className="dm-ring" /><div className="dm-ring dm-ring2" />
          <DiamondLogo size={120} className="dm-gem-svg" />
          <div className="dm-shine" />
        </div>
        <h1 className="dm-title font-extrabold" aria-label="Diamond Messenger">
          <div className="dm-word" aria-hidden="true">{word('DIAMOND', 700)}</div>
          <div className="dm-sub" aria-hidden="true">{word('MESSENGER', 1250)}</div>
        </h1>
        <div className="dm-bar"><i /></div>
      </div>
    </div>
  );
}
