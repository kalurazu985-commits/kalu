import { useId } from 'react';
export default function KaluLogo({ size = 36 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Kalu">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7c5cff" /><stop offset="1" stopColor="#22d3ee" /></linearGradient>
        <filter id={id + 'b'} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" /></filter>
      </defs>
      <path d="M10 14h44a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H30L16 59V48h-6a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill={`url(#${id})`} filter={`url(#${id}b)`} opacity=".55" />
      <path d="M10 12h44a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H30L16 57V46h-6a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill={`url(#${id})`} />
      <text x="32" y="36" textAnchor="middle" fontFamily="Outfit,Arial,sans-serif" fontWeight="800" fontSize="19" fill="#fff">Kalu</text>
    </svg>
  );
}
