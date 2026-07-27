import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 p-4 sm:hidden flex justify-center">
      <Link to="/login" className="font-button w-full flex items-center justify-center bg-gradient-to-r from-gold-400 to-gold-500 text-matcha-950 font-bold py-3 rounded-full shadow-lg text-sm">
        <Calendar className="w-4 h-4 mr-2" /> Daftar Sekarang
      </Link>
    </div>
  );
}
