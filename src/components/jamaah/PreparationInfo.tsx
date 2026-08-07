import React, { useState } from 'react';
import { Plane, Building, Bus, Users, Ticket, Printer, CheckCircle2, ChevronRight, User } from 'lucide-react';

interface PaxManifestItem {
  paxIndex: number;
  fullName: string;
  airplaneSeat: string;
  busNumber: string;
  hotelRoom: string;
}

interface ManifestData {
  busNumber?: string;
  hotelRoom?: string;
  airplaneSeat?: string;
  paxManifest?: PaxManifestItem[];
}

interface PreparationInfoProps {
  manifest: ManifestData | null;
  registration?: any;
}

export default function PreparationInfo({ manifest, registration }: PreparationInfoProps) {
  const [activePaxTab, setActivePaxTab] = useState(0);
  const [showPrintPassModal, setShowPrintPassModal] = useState(false);

  // Extract list of passengers from registration
  const paxDataList = registration?.paxData && Array.isArray(registration.paxData) && registration.paxData.length > 0
    ? registration.paxData
    : [{ fullName: registration?.ordererName || registration?.name || 'Jamaah Utama' }];

  const totalPax = paxDataList.length;

  // Helper function to resolve per-pax manifest info
  const getPaxManifestInfo = (index: number) => {
    const paxName = paxDataList[index]?.fullName || `Jamaah #${index + 1}`;
    
    // Check structured paxManifest array first
    if (manifest?.paxManifest && manifest.paxManifest[index]) {
      const pm = manifest.paxManifest[index];
      return {
        fullName: pm.fullName || paxName,
        airplaneSeat: pm.airplaneSeat || '-',
        busNumber: pm.busNumber || '-',
        hotelRoom: pm.hotelRoom || '-'
      };
    }

    // Fallback: parse comma-separated summary values if available
    const splitSeat = manifest?.airplaneSeat ? manifest.airplaneSeat.split(/[,;/]\s*/).map(s => s.trim()) : [];
    const splitBus = manifest?.busNumber ? manifest.busNumber.split(/[,;/]\s*/).map(b => b.trim()) : [];
    const splitRoom = manifest?.hotelRoom ? manifest.hotelRoom.split(/[,;/]\s*/).map(r => r.trim()) : [];

    const seat = splitSeat[index] || (splitSeat.length === 1 ? splitSeat[0] : manifest?.airplaneSeat || '-');
    const bus = splitBus[index] || (splitBus.length === 1 ? splitBus[0] : manifest?.busNumber || '-');
    const room = splitRoom[index] || (splitRoom.length === 1 ? splitRoom[0] : manifest?.hotelRoom || '-');

    return {
      fullName: paxName,
      airplaneSeat: seat || '-',
      busNumber: bus || '-',
      hotelRoom: room || '-'
    };
  };

  const activePaxInfo = getPaxManifestInfo(activePaxTab);

  if (!manifest || (!manifest.airplaneSeat && !manifest.busNumber && !manifest.hotelRoom && (!manifest.paxManifest || manifest.paxManifest.length === 0))) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center"> 
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-100">
          <Ticket className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm">Alokasi Manifes Keberangkatan</h3>
        <p className="text-gray-500 text-xs mt-1 max-w-md mx-auto">
          Nomor kursi pesawat, bus, dan kamar hotel sedang diproses oleh Tim Operasional Travel. Informasi akan otomatis diperbarui di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-3xl p-6 border border-gray-100 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-blue-100 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-600" /> Manifes Resmi Tervalidasi
            </span>
            {totalPax > 1 && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-amber-100 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-600" /> {totalPax} Jamaah Terdaftar
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-lg text-gray-900 mt-2 flex items-center">
            <Ticket className="w-5 h-5 mr-2 text-emerald-600" /> Manifes & Alokasi Perjalanan
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Rincian kursi pesawat, bus keberangkatan, dan kamar hotel seluruh rombongan Anda.</p>
        </div>

        <button
          onClick={() => setShowPrintPassModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Cetak Pass Manifes</span>
        </button>
      </div>

      {/* Multi-Jamaah Selector Tabs (if more than 1 pax) */}
      {totalPax > 1 && (
        <div className="mb-6">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" /> Pilih Jamaah untuk Melihat Rincian:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {paxDataList.map((pax, idx) => {
              const info = getPaxManifestInfo(idx);
              const isActive = activePaxTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActivePaxTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-md scale-[1.02]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <User className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} />
                  <span>{pax.fullName || `Jamaah #${idx + 1}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {info.airplaneSeat !== '-' ? info.airplaneSeat : 'Set'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Passenger Name Header if Multi-Pax */}
      {totalPax > 1 && (
        <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 font-black text-xs flex items-center justify-center shadow-sm">
              {activePaxTab + 1}
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Rincian Alokasi Untuk Jamaah #{activePaxTab + 1}</p>
              <h4 className="text-sm font-extrabold text-gray-900">{activePaxInfo.fullName}</h4>
            </div>
          </div>
          <span className="text-xs text-emerald-700 font-bold bg-white px-3 py-1 rounded-full border border-emerald-200">
            Terverifikasi
          </span>
        </div>
      )}

      {/* 3 Main Operational Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Kursi Pesawat */}
        <div className="flex flex-col p-4 bg-blue-50/60 rounded-2xl border border-blue-100 relative group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm"><Plane className="w-4 h-4" /></div>
              <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider">Kursi Pesawat</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-gray-900 tracking-tight font-mono">
              {activePaxInfo.airplaneSeat || '-'}
            </p>
            <p className="text-[10px] font-semibold text-blue-700 mt-1">
              {activePaxInfo.airplaneSeat !== '-' ? 'Boarding Pass Siap / Ekonomi Class' : 'Belum diisi'}
            </p>
          </div>
        </div>

        {/* Alokasi Bus */}
        <div className="flex flex-col p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 relative group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm"><Bus className="w-4 h-4" /></div>
              <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">Alokasi Bus</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-gray-900 tracking-tight">
              {activePaxInfo.busNumber || '-'}
            </p>
            <p className="text-[10px] font-semibold text-emerald-700 mt-1">
              {activePaxInfo.busNumber !== '-' ? 'Armada Bus Penjemputan Bandara & Ziarah' : 'Belum diisi'}
            </p>
          </div>
        </div>

        {/* Kamar Hotel */}
        <div className="flex flex-col p-4 bg-purple-50/60 rounded-2xl border border-purple-100 relative group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="bg-purple-600 text-white p-2 rounded-xl shadow-sm"><Building className="w-4 h-4" /></div>
              <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">Kamar Hotel</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl font-extrabold text-gray-900 tracking-tight">
              {activePaxInfo.hotelRoom || '-'}
            </p>
            <p className="text-[10px] font-semibold text-purple-700 mt-1">
              {activePaxInfo.hotelRoom !== '-' ? 'Hotel Makkah & Madinah' : 'Belum diisi'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary table list if multiple passengers */}
      {totalPax > 1 && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider flex items-center justify-between">
            <span>Ringkasan Seluruh Rombongan ({totalPax} Pax):</span>
            <span className="text-[10px] font-normal text-gray-400">Klik nama untuk melihat rincian di atas</span>
          </p>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100/80 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                  <th className="p-3">#</th>
                  <th className="p-3">Nama Jamaah</th>
                  <th className="p-3">Kursi Pesawat</th>
                  <th className="p-3">Alokasi Bus</th>
                  <th className="p-3">Kamar Hotel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paxDataList.map((_, idx) => {
                  const info = getPaxManifestInfo(idx);
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setActivePaxTab(idx)}
                      className={`cursor-pointer transition-colors ${activePaxTab === idx ? 'bg-emerald-50/80 font-bold text-emerald-950' : 'hover:bg-gray-100/50 text-gray-800'}`}
                    >
                      <td className="p-3 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-gray-900">{info.fullName}</td>
                      <td className="p-3 font-mono text-blue-700">{info.airplaneSeat}</td>
                      <td className="p-3 text-emerald-700">{info.busNumber}</td>
                      <td className="p-3 text-purple-700">{info.hotelRoom}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Digital Manifest Pass Modal for Printing/Viewing */}
      {showPrintPassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">Kartu Pass Manifes Keberangkatan</h3>
                  <p className="text-xs text-gray-500">PT. Golden Tour Haramain Umrah & Hajj Services</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintPassModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Pass Body */}
            <div className="space-y-6">
              <div className="p-4 bg-emerald-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[10px] text-amber-400 uppercase font-black tracking-widest">Pemesan / Kepala Rombongan</p>
                  <h4 className="text-lg font-bold">{registration?.ordererName || registration?.name || 'Jamaah Utama'}</h4>
                  <p className="text-xs text-emerald-200 mt-0.5">Paket: {registration?.packageName || 'Umrah Regular'}</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl text-right">
                  <p className="text-[10px] text-emerald-200 uppercase font-bold">Jumlah Rombongan</p>
                  <p className="text-base font-extrabold text-amber-300">{totalPax} Pax Jamaah</p>
                </div>
              </div>

              {/* Per-Passenger Printable Cards */}
              <div className="space-y-4">
                {paxDataList.map((_, idx) => {
                  const info = getPaxManifestInfo(idx);
                  return (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-gray-200 relative">
                      <div className="flex justify-between items-center mb-3">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase rounded-md">
                          Jamaah #{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-gray-400">ID: MANIFEST-{registration?.id?.substring(0,6) || 'PASS'}-{idx + 1}</span>
                      </div>
                      <h5 className="font-extrabold text-gray-900 text-base mb-3">{info.fullName}</h5>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                          <p className="text-[9px] font-bold uppercase text-gray-400">Kursi Pesawat</p>
                          <p className="text-sm font-extrabold font-mono text-blue-700 mt-0.5">{info.airplaneSeat}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                          <p className="text-[9px] font-bold uppercase text-gray-400">Alokasi Bus</p>
                          <p className="text-sm font-extrabold text-emerald-700 mt-0.5">{info.busNumber}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                          <p className="text-[9px] font-bold uppercase text-gray-400">Kamar Hotel</p>
                          <p className="text-sm font-extrabold text-purple-700 mt-0.5">{info.hotelRoom}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                Cetak Halaman Ini
              </button>
              <button
                type="button"
                onClick={() => setShowPrintPassModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
