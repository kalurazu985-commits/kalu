import { useId } from 'react';

// Premium diamond mark. Same artwork as /favicon.svg and the PWA icons.
export default function DiamondLogo({ size = 36, className = '' }) {
  const id = useId().replace(/:/g, '');
  const u = (k) => `url(#${id}${k})`;
  const g = (k, a, b, c, d, s0, s1) => (
    <linearGradient id={id + k} x1={a} y1={b} x2={c} y2={d}><stop offset="0" stopColor={s0} /><stop offset="1" stopColor={s1} /></linearGradient>);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-label="Diamond Messenger" role="img">
      <defs>
        {g('a', 0, 0, 1, 1, '#ffffff', '#a5f3fc')}
        {g('b', 0, 0, 0, 1, '#e0fbff', '#67e8f9')}
        {g('c', 0, 0, 1, 1, '#67e8f9', '#22a7e8')}
        {g('d', 0, 0, 1, 1, '#38bdf8', '#7c5cff')}
        {g('e', 1, 0, 0, 1, '#7c5cff', '#4c2fd0')}
        {g('f', 0, 0, 0, 1, '#22d3ee', '#6d4dff')}
        {g('g', 0, 0, 0, 1, '#8b5cf6', '#3b1fa8')}
        <filter id={id + 'blur'} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" /></filter>
      </defs>
      <path d="M6 26 21 12 43 12 58 26 32 57Z" fill={u('f')} filter={u('blur')} opacity=".75" />
      <g strokeLinejoin="round" stroke="#fff" strokeOpacity=".55" strokeWidth=".5">
        <path className="facet" d="M6 26 21 12 19 26Z" fill={u('c')} />
        <path className="facet" d="M21 12 32 26 19 26Z" fill={u('b')} />
        <path className="facet" d="M21 12 43 12 32 26Z" fill={u('a')} />
        <path className="facet" d="M43 12 45 26 32 26Z" fill={u('b')} fillOpacity=".92" />
        <path className="facet" d="M43 12 58 26 45 26Z" fill={u('d')} />
        <path className="facet" d="M6 26 19 26 32 57Z" fill={u('d')} />
        <path className="facet" d="M19 26 32 26 32 57Z" fill={u('c')} />
        <path className="facet" d="M32 26 45 26 32 57Z" fill={u('e')} />
        <path className="facet" d="M45 26 58 26 32 57Z" fill={u('g')} />
      </g>
      <path d="M6 26 21 12 43 12 58 26 32 57Z" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth=".9" strokeLinejoin="round" />
      <path d="M24 15.5 30 15.5 26.5 21Z" fill="#fff" opacity=".85" />
    </svg>
  );
}
