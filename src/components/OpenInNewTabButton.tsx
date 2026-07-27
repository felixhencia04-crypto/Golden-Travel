import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export default function OpenInNewTabButton() {
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    try {
      setInIframe(window.self !== window.top);
    } catch (e) {
      setInIframe(true);
    }
  }, []);

  const handleOpen = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  if (!inIframe) return null;

  return (
    <button
      onClick={handleOpen}
      className="fixed bottom-6 right-6 z-[99999] bg-emerald-900 hover:bg-emerald-950 text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/30 flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 group cursor-pointer"
      title="Buka Aplikasi di Tab Baru"
    >
      <ExternalLink className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
      <span>Buka di Tab Baru</span>
    </button>
  );
}

