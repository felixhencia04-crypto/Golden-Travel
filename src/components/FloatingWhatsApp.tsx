import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);
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

  const numbers = [
    {
      name: "Admin 1",
      phone: "6282283201103",
      formatted: "0822-8320-1103"
    },
    {
      name: "Admin 2",
      phone: "6282288308220",
      formatted: "0822-8830-8220"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none" ref={menuRef}>
      {/* Dropdown Menu */}
      <div 
        className={`mb-4 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-100 pointer-events-auto ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#25D366] text-white p-4">
          <h3 className="font-bold text-lg">Hubungi Kami</h3>
          <p className="text-sm opacity-90">Silakan pilih admin untuk konsultasi</p>
        </div>
        <div className="p-2">
          {numbers.map((item, idx) => (
            <a
              key={idx}
              href={`https://wa.me/${item.phone}?text=Halo%20Admin,%20saya%20ingin%20konsultasi`} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}
              
              
              
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                <p className="text-gray-500 text-xs">{item.formatted}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-button bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center relative focus:outline-none pointer-events-auto"
      >
        <div className="relative">
          <MessageCircle className={`w-8 h-8 transition-transform duration-300 ${isOpen ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}`} />
          <X className={`w-8 h-8 transition-transform duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 absolute'}`} />
        </div>
        {!isOpen && (
          <span className="absolute right-full mr-4 bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-medium shadow-lg opacity-0 lg:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chat via WhatsApp
          </span>
        )}
      </button>
    </div>
  );
}
