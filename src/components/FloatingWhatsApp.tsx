import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ShieldCheck, Headset, MessageSquare } from 'lucide-react';

export const WhatsAppSvgIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.332 5.001L2 22l5.129-1.341a9.96 9.96 0 004.883 1.28h.004c5.507 0 9.99-4.478 9.99-9.985 0-2.667-1.038-5.176-2.928-7.065A9.918 9.918 0 0012.012 2zm0 18.23h-.003a8.272 8.272 0 01-4.221-1.157l-.303-.18-3.136.82.836-3.056-.198-.315A8.257 8.257 0 013.75 11.98c0-4.555 3.707-8.258 8.262-8.258 2.207 0 4.282.86 5.843 2.423a8.204 8.204 0 012.417 5.839c0 4.557-3.707 8.26-8.26 8.26zm4.53-6.19c-.248-.124-1.468-.724-1.696-.807-.228-.083-.394-.124-.56.124-.165.248-.641.807-.786.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.23-.738-.658-1.237-1.47-1.382-1.718-.145-.248-.015-.382.109-.505.111-.11.248-.29.373-.435.124-.145.165-.248.248-.415.083-.166.042-.311-.02-.435-.062-.125-.56-1.348-.767-1.846-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.871.85-.871 2.073 0 1.223.891 2.404 1.015 2.57.124.166 1.754 2.679 4.248 3.758.593.257 1.056.41 1.417.525.596.19 1.138.163 1.567.099.479-.071 1.468-.6 1.675-1.18.207-.58.207-1.078.145-1.18-.062-.103-.228-.186-.476-.31z" />
  </svg>
);

interface FloatingWhatsAppProps {
  userName?: string;
  defaultTopic?: string;
}

export default function FloatingWhatsApp({ userName, defaultTopic }: FloatingWhatsAppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const admins = [
    {
      name: "Admin 1 (Keuangan & Pembayaran)",
      role: "Bantuan Setoran, Transfer & DP",
      phone: "6282283201103",
      formatted: "0822-8320-1103"
    },
    {
      name: "Admin 2 (Berkas & Pendaftaran)",
      role: "Bantuan Dokumen, Paspor & Layanan",
      phone: "6282288308220",
      formatted: "0822-8830-8220"
    }
  ];

  const buildWaUrl = (phone: string) => {
    const greeting = "Assalamu'alaikum Admin Golden Travel";
    const userDetail = userName ? `, saya *${userName}*` : '';
    const bodyText = customMsg.trim() 
      ? customMsg.trim() 
      : (defaultTopic ? `Saya mengalami kendala terkait *${defaultTopic}*. Mohon bantuannya.` : 'Saya butuh bantuan / informasi terkait portal jemaah.');
    
    const fullText = `${greeting}${userDetail}.\n\n${bodyText}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(fullText)}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none font-sans" ref={menuRef}>
      {/* Dropdown Menu */}
      <div 
        className={`mb-4 w-80 sm:w-96 max-h-[calc(100vh-110px)] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-100 pointer-events-auto ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header - Always visible at top */}
        <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white p-4 sm:p-5 relative overflow-hidden shrink-0">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-white pointer-events-none">
            <WhatsAppSvgIcon className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-xl">
                <Headset className="w-4 h-4 text-emerald-300" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide">Pusat Bantuan WhatsApp</h3>
            </div>
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-relaxed font-medium">
            Silakan hubungi tim Admin kami jika Anda mengalami kendala pada pendaftaran, verifikasi, atau dokumen.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200">Admin Siap Membantu (Online)</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-gray-100 custom-scrollbar">
          {/* Custom Message Input */}
          <div className="p-3.5 bg-gray-50/80">
            <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Tulis Pesan Kendala (Opsional):
            </label>
            <textarea
              rows={2}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="Contoh: Saya kendala saat upload bukti pembayaran..."
              className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none transition-all resize-none shadow-sm"
            />
          </div>

          {/* Contact list */}
          <div className="p-3 space-y-2">
            {admins.map((admin, idx) => (
              <a
                key={idx}
                href={buildWaUrl(admin.phone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-all shadow-sm">
                      <WhatsAppSvgIcon className="w-5 h-5" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-xs group-hover:text-emerald-950 transition-colors">
                      {admin.name}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium leading-tight">{admin.role}</p>
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5">{admin.formatted}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-[#25D366] text-gray-400 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer info - Always visible at bottom of menu */}
        <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center shrink-0">
          <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Layanan Bantuan Resmi Golden Travel
          </p>
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/40 pointer-events-auto cursor-pointer"
        aria-label="Hubungi Admin WhatsApp"
      >
        <div className="relative z-10 flex items-center justify-center">
          {isOpen ? (
            <X className="w-8 h-8 transition-transform duration-300 rotate-90" />
          ) : (
            <WhatsAppSvgIcon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
          )}
        </div>

        {/* Pulse Effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none"></div>
        )}

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-4 bg-gray-900 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xl opacity-0 lg:group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none flex items-center gap-2 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Ada Kendala? Chat Admin WhatsApp
          </div>
        )}
      </button>
    </div>
  );
}

