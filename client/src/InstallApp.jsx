import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

// Captured at module load so an early `beforeinstallprompt` is not missed
// while the intro / login screens are showing.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; notify(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; notify(); });
}

const DISMISS_KEY = 'kalu-install-dismissed';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.matchMedia?.('(display-mode: fullscreen)').matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const recentlyDismissed = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_MS; } catch { return false; }
};

export default function InstallApp() {
  const [, force] = useState(0);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [hidden, setHidden] = useState(() => recentlyDismissed());
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const update = () => { setInstalled(isStandalone()); force((n) => n + 1); };
    listeners.add(update);
    const mq = window.matchMedia?.('(display-mode: standalone)');
    mq?.addEventListener?.('change', update);
    return () => { listeners.delete(update); mq?.removeEventListener?.('change', update); };
  }, []);

  const ios = isIOS();
  if (installed || hidden) return null;
  if (!deferredPrompt && !ios) return null; // nothing installable to offer

  const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {} setHidden(true); setHelp(false); };

  const install = async () => {
    if (!deferredPrompt) { setHelp(true); return; }
    const p = deferredPrompt; deferredPrompt = null;
    try {
      await p.prompt();
      const { outcome } = await p.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    } catch {}
    notify();
  };

  return (
    <>
      <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2.5">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-400/30 shrink-0"><Download size={18} /></span>
        <div className="flex-1 min-w-0 text-sm"><div className="font-medium">Install KALU</div><div className="text-xs text-zinc-400 truncate">Add it to your home screen</div></div>
        <button onClick={install} className="rounded-xl bg-violet-500 hover:bg-violet-400 px-3 py-1.5 text-sm font-medium">Install App</button>
        <button onClick={dismiss} aria-label="Dismiss install prompt" className="text-zinc-400 hover:text-white"><X size={16} /></button>
      </div>
      {help && (
        <div className="fixed inset-0 z-50 grid place-items-end md:place-items-center bg-black/60 p-4" onClick={() => setHelp(false)}>
          <div className="glass pop w-full max-w-sm rounded-2xl border border-white/10 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-extrabold">Install KALU</h2>
              <button onClick={() => setHelp(false)} aria-label="Close" className="text-zinc-400 hover:text-white"><X size={18} /></button></div>
            <ol className="space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="font-bold text-violet-400">1.</span><span>Open KALU in <b>Safari</b> and tap the <Share size={15} className="inline -mt-1" /> <b>Share</b> button.</span></li>
              <li className="flex gap-2"><span className="font-bold text-violet-400">2.</span><span>Scroll down and tap <b>Add to Home Screen</b>.</span></li>
              <li className="flex gap-2"><span className="font-bold text-violet-400">3.</span><span>Tap <b>Add</b>. KALU will appear on your home screen.</span></li>
            </ol>
            <button onClick={() => setHelp(false)} className="mt-4 w-full rounded-xl bg-violet-500 hover:bg-violet-400 py-2 text-sm font-medium">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
