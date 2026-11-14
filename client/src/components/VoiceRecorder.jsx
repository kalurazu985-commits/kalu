import { useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

export default function VoiceRecorder({ onSend }) {
  const [rec, setRec] = useState(false); const [t, setT] = useState(0);
  const mr = useRef(), chunks = useRef([]), timer = useRef(), sec = useRef(0), cancel = useRef(false);
  const start = async () => {
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(st); mr.current = r; chunks.current = []; cancel.current = false; sec.current = 0; setT(0);
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = () => {
        st.getTracks().forEach((x) => x.stop()); clearInterval(timer.current); setRec(false);
        if (cancel.current || sec.current < 1) return;
        const rd = new FileReader(); const d = sec.current;
        rd.onload = () => onSend(rd.result, d);
        rd.readAsDataURL(new Blob(chunks.current, { type: r.mimeType }));
      };
      r.start(); setRec(true);
      timer.current = setInterval(() => { sec.current += 1; setT(sec.current); if (sec.current >= 120) r.stop(); }, 1000);
    } catch { alert('Microphone access is blocked. Allow it in your browser settings to send voice notes.'); }
  };
  const stop = (c) => { cancel.current = c; mr.current?.stop(); };
  if (!rec) return <button type="button" onClick={start} aria-label="Record voice note" className="p-2 text-zinc-400 hover:text-white"><Mic size={22} /></button>;
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => stop(true)} aria-label="Discard recording" className="p-2 text-zinc-400"><Trash2 size={20} /></button>
      <span className="flex items-center gap-1 text-rose-400 text-sm tabular-nums"><i className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />{Math.floor(t / 60)}:{String(t % 60).padStart(2, '0')}</span>
      <button type="button" onClick={() => stop(false)} aria-label="Send voice note" className="p-2 rounded-full bg-rose-500"><Square size={16} fill="white" /></button>
    </div>
  );
}
