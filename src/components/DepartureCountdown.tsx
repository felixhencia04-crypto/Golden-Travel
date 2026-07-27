import React, { useState, useEffect } from 'react';

export default function DepartureCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 35,
    hours: 4,
    minutes: 23,
    seconds: 30
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 35);
    targetDate.setHours(targetDate.getHours() + 4);
    targetDate.setMinutes(targetDate.getMinutes() + 23);
    targetDate.setSeconds(targetDate.getSeconds() + 30);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center gap-4 sm:gap-6 mt-16 mb-8">
      {[
        { label: 'HARI', value: timeLeft.days },
        { label: 'JAM', value: timeLeft.hours },
        { label: 'MENIT', value: timeLeft.minutes },
        { label: 'DETIK', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-20 h-24 sm:w-24 sm:h-28 bg-[#2A342D] rounded-[1.5rem] flex items-center justify-center border border-white/5 shadow-2xl mb-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10"></div>
            <span className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-wider">
              {item.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-[#E8C766] text-xs sm:text-sm font-bold tracking-[0.2em]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
