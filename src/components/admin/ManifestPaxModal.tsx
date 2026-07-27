import React, { useState, useEffect } from 'react';
import { X, Users, Plane, Bus, Building, Sparkles, Check, Copy } from 'lucide-react';

interface PaxItem {
  paxIndex: number;
  fullName: string;
  airplaneSeat: string;
  busNumber: string;
  hotelRoom: string;
}

interface ManifestPaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultation: any;
  existingManifest: any;
  onSave: (registrationId: string, payload: { airplaneSeat: string; busNumber: string; hotelRoom: string; paxManifest: PaxItem[] }) => Promise<void>;
}

export default function ManifestPaxModal({
  isOpen,
  onClose,
  consultation,
  existingManifest,
  onSave
}: ManifestPaxModalProps) {
  const [paxItems, setPaxItems] = useState<PaxItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!consultation) return;

    // Determine pax list from consultation
    const rawPaxData = consultation.paxData && Array.isArray(consultation.paxData) && consultation.paxData.length > 0
      ? consultation.paxData
      : [{ fullName: consultation.ordererName || consultation.name || 'Jamaah Utama' }];

    // Check if existingManifest has paxManifest
    const existingPaxManifest = existingManifest?.paxManifest && Array.isArray(existingManifest.paxManifest)
      ? existingManifest.paxManifest
      : [];

    // Split summary fields if paxManifest array is empty
    const splitSeats = existingManifest?.airplaneSeat ? existingManifest.airplaneSeat.split(/[,;/]\s*/).map((s: string) => s.trim()) : [];
    const splitBuses = existingManifest?.busNumber ? existingManifest.busNumber.split(/[,;/]\s*/).map((b: string) => b.trim()) : [];
    const splitRooms = existingManifest?.hotelRoom ? existingManifest.hotelRoom.split(/[,;/]\s*/).map((r: string) => r.trim()) : [];

    const items: PaxItem[] = rawPaxData.map((pax: any, idx: number) => {
      const pm = existingPaxManifest[idx];
      return {
        paxIndex: idx,
        fullName: pm?.fullName || pax.fullName || `Jamaah #${idx + 1}`,
        airplaneSeat: pm?.airplaneSeat || splitSeats[idx] || (splitSeats.length === 1 ? splitSeats[0] : ''),
        busNumber: pm?.busNumber || splitBuses[idx] || (splitBuses.length === 1 ? splitBuses[0] : ''),
        hotelRoom: pm?.hotelRoom || splitRooms[idx] || (splitRooms.length === 1 ? splitRooms[0] : ''),
      };
    });

    setPaxItems(items);
  }, [consultation, existingManifest]);

  if (!isOpen || !consultation) return null;

  const handleSeatChange = (index: number, val: string) => {
    const updated = [...paxItems];
    updated[index].airplaneSeat = val;
    setPaxItems(updated);
  };

  const handleBusChange = (index: number, val: string) => {
    const updated = [...paxItems];
    updated[index].busNumber = val;
    setPaxItems(updated);
  };

  const handleRoomChange = (index: number, val: string) => {
    const updated = [...paxItems];
    updated[index].hotelRoom = val;
    setPaxItems(updated);
  };

  // Helper: Auto-sequence seats if user enters e.g. "12A" in row 0
  const autoSequenceSeats = () => {
    if (paxItems.length === 0) return;
    const startSeat = paxItems[0].airplaneSeat.trim().toUpperCase();
    if (!startSeat) return;

    // Match e.g. "12A" -> number 12, letter A
    const match = startSeat.match(/^(\d+)([A-Z])$/);
    if (match) {
      const rowNum = parseInt(match[1]);
      const letterCode = match[2].charCodeAt(0);

      const updated = paxItems.map((item, idx) => {
        // Increment letter e.g. 12A, 12B, 12C...
        const currentLetterCode = letterCode + idx;
        const currentLetter = String.fromCharCode(currentLetterCode);
        return {
          ...item,
          airplaneSeat: `${rowNum}${currentLetter}`
        };
      });
      setPaxItems(updated);
    }
  };

  // Helper: Copy Bus 1 to all
  const copyBusToAll = () => {
    if (paxItems.length === 0) return;
    const firstBus = paxItems[0].busNumber;
    if (!firstBus) return;

    const updated = paxItems.map(item => ({ ...item, busNumber: firstBus }));
    setPaxItems(updated);
  };

  // Helper: Copy Room 1 to all
  const copyRoomToAll = () => {
    if (paxItems.length === 0) return;
    const firstRoom = paxItems[0].hotelRoom;
    if (!firstRoom) return;

    const updated = paxItems.map(item => ({ ...item, hotelRoom: firstRoom }));
    setPaxItems(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build summary strings
      const summarySeats = paxItems.map(p => p.airplaneSeat).filter(Boolean).join(', ');
      const summaryBuses = Array.from(new Set(paxItems.map(p => p.busNumber).filter(Boolean))).join(', ');
      const summaryRooms = Array.from(new Set(paxItems.map(p => p.hotelRoom).filter(Boolean))).join(', ');

      await onSave(consultation.id, {
        airplaneSeat: summarySeats,
        busNumber: summaryBuses,
        hotelRoom: summaryRooms,
        paxManifest: paxItems
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl relative border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-gray-900 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">Kelola Manifes Per-Jamaah</h3>
              <p className="text-xs text-gray-500">
                Kelompok Pemesan: <span className="font-bold text-gray-800">{consultation.name || consultation.ordererName}</span> ({paxItems.length} Pax Jamaah)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100 mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" /> Otomatisasi Input Cepat:
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={autoSequenceSeats}
              className="px-3 py-1.5 bg-white border border-amber-200 text-amber-950 font-bold rounded-xl hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
              title="Mengurutkan kursi otomatis berdasarkan baris awal (mis. 12A -> 12B, 12C)"
            >
              ✈️ Urutkan Kursi (12A, 12B..)
            </button>
            <button
              type="button"
              onClick={copyBusToAll}
              className="px-3 py-1.5 bg-white border border-amber-200 text-amber-950 font-bold rounded-xl hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
            >
              🚌 Samakan Bus #1 All Pax
            </button>
            <button
              type="button"
              onClick={copyRoomToAll}
              className="px-3 py-1.5 bg-white border border-amber-200 text-amber-950 font-bold rounded-xl hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
            >
              🏨 Samakan Kamar #1 All Pax
            </button>
          </div>
        </div>

        {/* Jamaah List Table */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 shadow-2xs mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px] sticky top-0 bg-white shadow-2xs">
              <tr>
                <th className="p-3.5 w-12 text-center">#</th>
                <th className="p-3.5">Nama Lengkap Jamaah</th>
                <th className="p-3.5 w-36">
                  <span className="flex items-center gap-1 text-blue-700">
                    <Plane className="w-3.5 h-3.5" /> Kursi Pesawat
                  </span>
                </th>
                <th className="p-3.5 w-36">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Bus className="w-3.5 h-3.5" /> Alokasi Bus
                  </span>
                </th>
                <th className="p-3.5 w-36">
                  <span className="flex items-center gap-1 text-purple-700">
                    <Building className="w-3.5 h-3.5" /> Kamar Hotel
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paxItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 text-center font-bold text-gray-400 font-mono">{idx + 1}</td>
                  <td className="p-3.5">
                    <p className="font-bold text-gray-900 text-sm">{item.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-mono">ID Jamaah: #{idx + 1}</p>
                  </td>
                  <td className="p-3.5">
                    <input
                      type="text"
                      value={item.airplaneSeat}
                      onChange={(e) => handleSeatChange(idx, e.target.value)}
                      placeholder="e.g. 12A"
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </td>
                  <td className="p-3.5">
                    <input
                      type="text"
                      value={item.busNumber}
                      onChange={(e) => handleBusChange(idx, e.target.value)}
                      placeholder="e.g. Bus 01"
                      className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    />
                  </td>
                  <td className="p-3.5">
                    <input
                      type="text"
                      value={item.hotelRoom}
                      onChange={(e) => handleRoomChange(idx, e.target.value)}
                      placeholder="e.g. 301"
                      className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            *Semua perubahan alokasi otomatis tersinkron ke portal jamaah secara realtime.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-900 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Menyimpan...' : (
                <>
                  <Check className="w-4 h-4" /> Simpan All Manifes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
