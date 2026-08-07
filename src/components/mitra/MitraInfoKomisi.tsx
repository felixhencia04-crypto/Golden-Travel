import React, { useState } from 'react';
import { 
  Award, TrendingUp, Gift, DollarSign, Sparkles, Calculator, Users, 
  CheckCircle2, Plane, ShieldCheck, Crown, ArrowRight, Zap, Info,
  HelpCircle, ChevronRight, Star, HeartHandshake, FileText
} from 'lucide-react';

export default function MitraInfoKomisi() {
  // Simulator State
  const [harmoniCount, setHarmoniCount] = useState<number>(43);
  const [madaniCount, setMadaniCount] = useState<number>(0);
  const [insaniCount, setInsaniCount] = useState<number>(0);
  const [isTourLeader, setIsTourLeader] = useState<boolean>(true);

  // Prices & Rates
  const HARMONI_FEE = 2000000;
  const MADANI_FEE = 2500000;
  const INSANI_FEE = 3000000;
  const BONUS_PRESTASI_PER_10 = 1500000;
  const TOUR_LEADER_SEAT_VALUE = 34000000;
  const TOUR_LEADER_POCKET_MONEY = 2500000;

  // Calculations
  const totalJamaah = harmoniCount + madaniCount + insaniCount;
  
  const totalUjrohHarmoni = harmoniCount * HARMONI_FEE;
  const totalUjrohMadani = madaniCount * MADANI_FEE;
  const totalUjrohInsani = insaniCount * INSANI_FEE;
  const totalUjrohDasar = totalUjrohHarmoni + totalUjrohMadani + totalUjrohInsani;

  // Bonus Prestasi: per 10 jamaah dalam 1x keberangkatan
  const bonusPrestasiMultiplier = Math.floor(totalJamaah / 10);
  const totalBonusPrestasi = bonusPrestasiMultiplier * BONUS_PRESTASI_PER_10;

  // Tour Leader perks
  const hasTourLeaderEligible = totalJamaah >= 40 && isTourLeader;
  const tourLeaderSeatBonus = hasTourLeaderEligible ? TOUR_LEADER_SEAT_VALUE : 0;
  const tourLeaderPocketBonus = hasTourLeaderEligible ? TOUR_LEADER_POCKET_MONEY : 0;

  // Grand Total
  const grandTotalKomisi = totalUjrohDasar + totalBonusPrestasi + tourLeaderSeatBonus + tourLeaderPocketBonus;

  // Free Umroh Progress (90 Jamaah)
  const freeUmrohTarget = 90;
  const freeUmrohCount = Math.floor(totalJamaah / freeUmrohTarget);
  const freeUmrohProgress = Math.min(100, Math.round((totalJamaah % freeUmrohTarget) / freeUmrohTarget * 100));

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HERO BANNER - GOLDEN BRANDING */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-8 sm:p-10 text-white shadow-2xl border border-emerald-800/50">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Award className="w-96 h-96 text-amber-300" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Skema Komisi & Bonus Kemitraan Syiar
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-black text-white leading-tight">
            FEE & UJROH MITRA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400">
              PT. GOLDEN TOUR HARAMAIN
            </span>
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base font-normal leading-relaxed">
            Dapatkan potensi penghasilan tak terbatas dan bonus apresiasi ibadah. Dengan jargon <strong className="text-amber-300 font-bold">"MODAL RECEH, HASIL JUTAAN"</strong>, kami berkomitmen memberikan hak ujroh terbaik bagi para pejuang syiar Baitullah.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-emerald-200">
            <span className="flex items-center gap-1.5 bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Transparan & Tepat Waktu
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <Star className="w-4 h-4 text-amber-400" /> Akad Syariah & Berkah
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <Crown className="w-4 h-4 text-amber-400" /> Reward Gratis Umroh Kelipatan
            </span>
          </div>
        </div>
      </div>

      {/* 1. SKEMA UJROH PER PAKET (SLIDE 1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              1. Fee / Ujroh Dasar Per Paket Jamaah
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Komisi langsung yang didapatkan Mitra Agen untuk setiap 1 orang jamaah yang mendaftar & lunas
            </p>
          </div>
          <span className="hidden sm:inline-flex text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            Pencairan Langsung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* HARMONI */}
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Paket Harmoni
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  💰
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ujroh Per Jamaah</p>
                <div className="text-3xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors mt-1">
                  Rp 2.000.000
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Berlaku untuk seluruh keberangkatan Harmoni
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Termasuk perhitungan Bonus Prestasi per 10 orang
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Masuk akumulasi Gratis Umroh (90 Jamaah)
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-emerald-700 flex items-center justify-between">
              <span>Akomodasi Hotel Bintang 3-4</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* MADANI */}
          <div className="group relative bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 hover:border-amber-400/80 shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Paket Madani (Popular)
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-lg">
                  ⭐
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ujroh Per Jamaah</p>
                <div className="text-3xl font-black text-amber-300 mt-1">
                  Rp 2.500.000
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  Berlaku untuk seluruh keberangkatan Madani
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  Termasuk perhitungan Bonus Prestasi per 10 orang
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  Akomodasi Hotel Bintang 4 Ring 1
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-bold text-amber-300 flex items-center justify-between">
              <span>Keberangkatan Favorit</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* INSANI */}
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 uppercase tracking-wider">
                  Paket Insani (VIP)
                </span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg">
                  👑
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ujroh Per Jamaah</p>
                <div className="text-3xl font-black text-slate-900 group-hover:text-purple-700 transition-colors mt-1">
                  Rp 3.000.000
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  Berlaku untuk seluruh keberangkatan Insani VIP
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  Termasuk perhitungan Bonus Prestasi per 10 orang
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  Hotel Bintang 5 Depan Pelataran Masjidil Haram
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-purple-700 flex items-center justify-between">
              <span>Kelas Eksekutif VIP</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. BONUS PRESTASI & BONUS MITRA UMROH (SLIDE 2 & 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SLIDE 2: BONUS PRESTASI */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-8 shadow-xl border border-emerald-700 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <TrendingUp className="w-64 h-64 text-amber-300" />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Zap className="w-3.5 h-3.5" /> Bonus Tambahan Per Grup
            </div>

            <div>
              <h3 className="text-2xl font-playfair font-black text-white">BONUS PRESTASI</h3>
              <p className="text-xs text-emerald-200 mt-1 font-medium">
                Apresiasi khusus bagi mitra yang berhasil menghimpun rombongan jamaah dalam 1x jadwal keberangkatan.
              </p>
            </div>

            <div className="bg-emerald-950/60 p-6 rounded-2xl border border-emerald-700/60 space-y-3">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                KELIPATAN PER 10 (SEPULUH) JAMAAH
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400">
                BONUS Rp 1.500.000,-
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Diberikan per kelipatan 10 orang jamaah dalam 1x tanggal/jadwal keberangkatan yang sama.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="bg-emerald-800/40 p-3 rounded-xl border border-emerald-700/40">
                <span className="text-amber-300 font-bold">10 Jamaah:</span> +Rp 1.500.000
              </div>
              <div className="bg-emerald-800/40 p-3 rounded-xl border border-emerald-700/40">
                <span className="text-amber-300 font-bold">20 Jamaah:</span> +Rp 3.000.000
              </div>
              <div className="bg-emerald-800/40 p-3 rounded-xl border border-emerald-700/40">
                <span className="text-amber-300 font-bold">30 Jamaah:</span> +Rp 4.500.000
              </div>
              <div className="bg-emerald-800/40 p-3 rounded-xl border border-emerald-700/40">
                <span className="text-amber-300 font-bold">40 Jamaah:</span> +Rp 6.000.000
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-700/60 text-xs text-emerald-200 font-medium flex items-center justify-between">
            <span>Slogan Syiar: Modal Receh, Hasil Jutaan</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* SLIDE 4: BONUS MITRA - GRATIS UMROH */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-slate-900 rounded-3xl p-8 shadow-xl border border-amber-300 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-15 pointer-events-none">
            <Crown className="w-64 h-64 text-white" />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/10 text-slate-900 text-xs font-black border border-slate-900/20">
              <Gift className="w-3.5 h-3.5" /> Reward Apresiasi Terbesar
            </div>

            <div>
              <h3 className="text-2xl font-playfair font-black text-slate-900">BONUS GRATIS UMROH</h3>
              <p className="text-xs text-slate-900/80 mt-1 font-semibold">
                Pencapaian akumulatif sebagai penghargaan atas dedikasi syiar jamaah Baitullah.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur p-6 rounded-2xl border border-white/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Syarat Pencapaian</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-800 text-white">AKUMULASI SEUMUR HIDUP</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-900">
                90 JAMAAH = <span className="text-amber-600">GRATIS 1 SEAT UMROH</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Setiap Mitra yang berhasil mengumpulkan total 90 jamaah (Paket Harmoni) berhak memperoleh 1 paket Umroh Gratis.
              </p>
            </div>

            <div className="space-y-2 text-xs font-bold text-slate-900 bg-amber-400/30 p-4 rounded-xl border border-amber-500/30">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-900 shrink-0 mt-0.5" />
                <span>AKUMULASI TANPA BATASAN WAKTU (Dapat dikumpulkan bertahap seumur hidup)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-900 shrink-0 mt-0.5" />
                <span>TIDAK BOLEH DIUANGKAN (Murni voucher/seat keberangkatan ibadah)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-900 shrink-0 mt-0.5" />
                <span>BERLAKU KELIPATAN (Setiap kelipatan 90 jamaah = +1 Seat Gratis Umroh)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900/20 text-xs text-slate-900 font-bold flex items-center justify-between">
            <span>PT Golden Tour Haramain</span>
            <Plane className="w-4 h-4 text-emerald-900" />
          </div>
        </div>
      </div>

      {/* 3. SIMULASI KHUSUS SLIDE 3 & KALKULATOR INTERAKTIF */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Calculator className="w-4 h-4" /> Simulasi & Kalkulator Komisi Live
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Simulasi Ujroh & Estimasi Total Pendapatan
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Gunakan simulasi interaktif di bawah ini untuk menghitung komisi, bonus prestasi, dan hak Tour Leader Anda.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contoh Riil Slide 3</span>
            <span className="text-sm font-black text-emerald-800">43 Jamaah Harmoni = Rp 128.500.000</span>
          </div>
        </div>

        {/* INPUT SIMULATOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: CONTROLS */}
          <div className="lg:col-span-6 space-y-6 bg-slate-50/80 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Input Jumlah Jamaah Anda
            </h4>

            {/* HARMONI */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">Jamaah Paket Harmoni (Rp 2 Juta/Pax)</label>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">{harmoniCount} Pax</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={harmoniCount} 
                onChange={(e) => setHarmoniCount(parseInt(e.target.value) || 0)}
                className="w-full accent-emerald-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0</span>
                <span>43 (Contoh Slide)</span>
                <span>100 Pax</span>
              </div>
            </div>

            {/* MADANI */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">Jamaah Paket Madani (Rp 2,5 Juta/Pax)</label>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-mono">{madaniCount} Pax</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={madaniCount} 
                onChange={(e) => setMadaniCount(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* INSANI */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-700">Jamaah Paket Insani (Rp 3 Juta/Pax)</label>
                <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md font-mono">{insaniCount} Pax</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={insaniCount} 
                onChange={(e) => setInsaniCount(parseInt(e.target.value) || 0)}
                className="w-full accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* TOUR LEADER OPTION */}
            <div className="pt-3 border-t border-slate-200">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-500 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isTourLeader} 
                  onChange={(e) => setIsTourLeader(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 rounded accent-emerald-700"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Menjadi Tour Leader / Pembimbing Grup</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Berhak atas 1 Seat Umroh Gratis + Uang Saku TL apabila rombongan ≥ 40 Jamaah
                  </span>
                </div>
              </label>
            </div>

            {/* PRESET BUTTONS */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setHarmoniCount(43); setMadaniCount(0); setInsaniCount(0); setIsTourLeader(true); }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold hover:bg-emerald-800 transition-all shadow-sm"
              >
                Set Preset Slide 3 (43 Jamaah)
              </button>
              <button
                onClick={() => { setHarmoniCount(10); setMadaniCount(10); setInsaniCount(10); setIsTourLeader(false); }}
                className="py-2 px-3 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-all"
              >
                Reset (30 Jamaah)
              </button>
            </div>
          </div>

          {/* RIGHT: BREAKDOWN CALCULATION RESULT */}
          <div className="lg:col-span-6 bg-gradient-to-b from-slate-900 to-emerald-950 text-white p-7 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-4">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Rincian Kalkulasi</span>
                <h4 className="text-lg font-bold text-white">Total Jamaah: {totalJamaah} Orang</h4>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900">
                PT Golden Tour Haramain
              </span>
            </div>

            {/* ITEMIZED BREAKDOWN */}
            <div className="space-y-3 text-xs">
              {/* UJROH DASAR */}
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-800/40">
                <span className="text-slate-300 font-medium">
                  ✓ Ujroh Dasar ({totalJamaah} Jamaah):
                </span>
                <span className="font-bold text-amber-300 font-mono">{formatRupiah(totalUjrohDasar)}</span>
              </div>

              {/* BONUS PRESTASI */}
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-800/40">
                <span className="text-slate-300 font-medium">
                  ✓ Bonus Prestasi ({bonusPrestasiMultiplier}x kelipatan 10):
                </span>
                <span className="font-bold text-amber-300 font-mono">{formatRupiah(totalBonusPrestasi)}</span>
              </div>

              {/* GRATIS SEAT TOUR LEADER */}
              <div className="flex justify-between items-start py-1.5 border-b border-emerald-800/40">
                <div>
                  <span className="text-slate-300 font-medium block">
                    ✓ Gratis Umroh Tour Leader (S&K):
                  </span>
                  {!hasTourLeaderEligible && totalJamaah < 40 && (
                    <span className="text-[10px] text-amber-400/80 italic">Needs min. 40 Jamaah</span>
                  )}
                </div>
                <span className="font-bold text-emerald-300 font-mono">
                  {hasTourLeaderEligible ? formatRupiah(TOUR_LEADER_SEAT_VALUE) : 'Rp 0'}
                </span>
              </div>

              {/* UANG SAKU TOUR LEADER */}
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-800/40">
                <span className="text-slate-300 font-medium">
                  ✓ Uang Saku Tour Leader:
                </span>
                <span className="font-bold text-emerald-300 font-mono">
                  {hasTourLeaderEligible ? formatRupiah(TOUR_LEADER_POCKET_MONEY) : 'Rp 0'}
                </span>
              </div>
            </div>

            {/* GRAND TOTAL */}
            <div className="pt-2">
              <div className="bg-emerald-900/80 p-5 rounded-2xl border border-amber-400/50 space-y-1">
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                  ESTIMASI TOTAL VALUE PENDAPATAN MITRA:
                </div>
                <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                  {formatRupiah(grandTotalKomisi)}
                </div>
              </div>
            </div>

            {/* FREE UMROH REWARD TRACKER */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Progress Gratis Umroh (90 Pax):
                </span>
                <span className="text-amber-400">{totalJamaah} / 90 Jamaah ({freeUmrohProgress}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${freeUmrohProgress}%` }} 
                />
              </div>
              {freeUmrohCount > 0 && (
                <div className="text-[11px] font-black text-amber-300 text-center pt-1">
                  🎉 Selamat! Anda telah berhak mendapatkan {freeUmrohCount} Seat Gratis Umroh!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BANNER / CATATAN PENTING */}
      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-amber-700 shrink-0 mt-1" />
          <div className="space-y-1 text-xs">
            <h5 className="font-bold text-amber-900 text-sm">Ketentuan Pencairan Komisi Mitra:</h5>
            <p className="text-amber-800 font-medium leading-relaxed">
              Pencairan komisi dapat diajukan secara mandiri melalui menu <strong>Pengajuan Komisi</strong> di Mitra Panel setelah status pembayaran calon jamaah diverifikasi oleh Tim Keuangan PT Golden Tour Haramain.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <span className="px-4 py-2 rounded-xl bg-amber-200 text-amber-900 font-bold text-xs shadow-sm">
            PT. GOLDEN TOUR HARAMAIN
          </span>
        </div>
      </div>
    </div>
  );
}
