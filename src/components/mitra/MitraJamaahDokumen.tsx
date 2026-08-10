import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, Download, CheckCircle2, AlertCircle, Clock, 
  Trash2, Eye, Users, FileCheck, ShieldAlert, Sparkles, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { getScopedKey, filterJamaahForCurrentMitra } from '../../utils/mitraStorage';

interface MitraJamaahDokumenProps {
  jamaahList: any[];
  onRefresh?: () => void;
}

export default function MitraJamaahDokumen({ jamaahList, onRefresh }: MitraJamaahDokumenProps) {
  const [localPaxList, setLocalPaxList] = useState<any[]>(() => {
    try {
      const scopedKey = getScopedKey('mitra_saved_pax_list');
      const saved = localStorage.getItem(scopedKey);
      const centralStr = localStorage.getItem('mitra_jamaah_database');
      const filteredCentral = centralStr ? filterJamaahForCurrentMitra(JSON.parse(centralStr)) : [];

      if (saved) {
        const parsedSaved = JSON.parse(saved);
        if (Array.isArray(parsedSaved) && parsedSaved.length > 0) {
          return parsedSaved.map((p: any) => {
            const match = filteredCentral.find((c: any) => c.id === p.id);
            return match ? { ...p, documents: match.documents || p.documents } : p;
          });
        }
      }

      if (filteredCentral.length > 0) return filteredCentral;
      if (jamaahList && jamaahList.length > 0) return filterJamaahForCurrentMitra(jamaahList);
    } catch (e) {}
    return [];
  });

  // Real-time listener for Admin updates
  useEffect(() => {
    const handleSync = () => {
      try {
        const scopedKey = getScopedKey('mitra_saved_pax_list');
        const centralStr = localStorage.getItem('mitra_jamaah_database');
        const savedStr = localStorage.getItem(scopedKey);
        
        const filteredCentral = centralStr ? filterJamaahForCurrentMitra(JSON.parse(centralStr)) : [];
        if (savedStr) {
          const parsedSaved = JSON.parse(savedStr);
          const updated = parsedSaved.map((p: any) => {
            const match = filteredCentral.find((c: any) => c.id === p.id);
            return match ? { ...p, documents: match.documents || p.documents } : p;
          });
          setLocalPaxList(updated);
        } else if (filteredCentral.length > 0) {
          setLocalPaxList(filteredCentral);
        }
      } catch (e) {
        console.error("Sync error:", e);
      }
    };

    window.addEventListener('mitra_jamaah_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mitra_jamaah_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const activeJamaahList = localPaxList.filter(p => p.isComplete || p.userName);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedJamaah = activeJamaahList[selectedIndex] || activeJamaahList[0];

  // Sync helper
  const syncToCentralDatabase = async (updatedList: any[]) => {
    const scopedKey = getScopedKey('mitra_saved_pax_list');
    localStorage.setItem(scopedKey, JSON.stringify(updatedList));
    
    // Also sync to the central database that Admin portal reads
    let updatedCentral: any[] = [];
    try {
      const centralDb = JSON.parse(localStorage.getItem('mitra_jamaah_database') || '[]');
      updatedCentral = centralDb.map((j: any) => {
        const match = updatedList.find(p => p.id === j.id);
        if (match) {
          return { 
            ...j, 
            documents: match.documents,
            statusDokumen: 'pending' // Reset to pending when new doc uploaded
          };
        }
        return j;
      });
      localStorage.setItem('mitra_jamaah_database', JSON.stringify(updatedCentral));
    } catch (e) {
      console.error('Failed to sync with central database:', e);
    }

    // Persist to PostgreSQL database first
    try {
      if (updatedCentral.length > 0) {
        const currentMitraJamaah = filterJamaahForCurrentMitra(updatedCentral);
        await api.post('/mitra/jamaah/sync', { jamaahList: currentMitraJamaah });
      }
    } catch (err) {
      console.warn('Failed to sync mitra jamaah documents to backend:', err);
    }

    window.dispatchEvent(new Event('mitra_jamaah_updated'));
    if (onRefresh) onRefresh();
  };

  if (activeJamaahList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto mt-8">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
          <Users className="w-12 h-12 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Belum Ada Jemaah Siap Unggah</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Data jemaah yang muncul di sini adalah jemaah yang sudah <span className="text-emerald-600 font-bold">Lengkap Biodatanya</span>. 
            Silakan lengkapi biodata jemaah di menu sebelumnya terlebih dahulu.
          </p>
        </div>
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400 font-bold italic">
            <Sparkles className="w-3.5 h-3.5" />
            Tips: Pastikan tombol "Simpan & Selesaikan" sudah ditekan di bagian Biodata
          </div>
        </div>
      </div>
    );
  }

  const isMarried = selectedJamaah?.statusPernikahan === 'Menikah';

  const docRequirements = [
    { id: 'ktp', label: 'KTP Asli', desc: 'Scan KTP asli berwarna & tidak terpotong', required: true },
    { id: 'kk', label: 'Kartu Keluarga (KK)', desc: 'Scan KK asli versi terbaru', required: true },
    { id: 'paspor', label: 'Paspor Asli (Halaman Depan)', desc: 'Halaman foto & identitas paspor RI', required: true },
    { id: 'foto', label: 'Pas Foto 4x6 (Background Putih)', desc: 'Fokus wajah 80%, pakaian kontras', required: true },
    { id: 'buku_nikah', label: 'Buku Nikah / Akta Nikah', desc: 'Wajib bagi pasangan suami-istri', required: true, show: isMarried },
  ].filter(d => d.show !== false);

  const handleUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedJamaah) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileUrl = event.target?.result as string;

        const updatedList = localPaxList.map(p => {
          if (p.id === selectedJamaah.id) {
            return {
              ...p,
              documents: {
                ...(p.documents || {}),
                [docId]: { 
                  url: fileUrl, 
                  fileUrl: fileUrl,
                  status: 'pending', 
                  uploadedAt: new Date().toISOString(),
                  fileType: file.type,
                  fileName: file.name
                }
              }
            };
          }
          return p;
        });
        
        setLocalPaxList(updatedList);
        await syncToCentralDatabase(updatedList);
        toast.success(`Dokumen ${docRequirements.find(d => d.id === docId)?.label} berhasil diunggah! Menunggu verifikasi admin.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (docId: string) => {
    if (!selectedJamaah) return;
    const updatedList = localPaxList.map(p => {
      if (p.id === selectedJamaah.id) {
        const newDocs = { ...(p.documents || {}) };
        delete newDocs[docId];
        return { ...p, documents: newDocs };
      }
      return p;
    });
    
    setLocalPaxList(updatedList);
    syncToCentralDatabase(updatedList);
    toast.info('Dokumen berhasil dihapus.');
  };

  const docs = selectedJamaah?.documents || {};
  const verifiedCount = Object.values(docs).filter((d: any) => d.status === 'verified').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Selector & Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Jamaah</div>
            <div className="relative mt-1">
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                className="w-full md:w-72 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer pr-10"
              >
                {activeJamaahList.map((j, idx) => (
                  <option key={j.id || idx} value={idx}>
                    {j.userName || j.name || `Jamaah ${idx + 1}`} ({j.packageName || 'Paket Ibadah'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Dokumen</div>
            <div className="text-sm font-black text-slate-900">{verifiedCount} dari {docRequirements.length} Terverifikasi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm border border-emerald-300">
            {Math.round((verifiedCount / docRequirements.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docRequirements.map((req) => {
          const currentDoc = docs[req.id] || { url: '', status: 'none' };

          return (
            <div 
              key={req.id} 
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    {currentDoc.status === 'verified' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> TERVERIFIKASI
                      </span>
                    )}
                    {currentDoc.status === 'pending' && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> MENUNGGU VERIFIKASI
                      </span>
                    )}
                    {currentDoc.status === 'rejected' && (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-black border border-red-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" /> DITOLAK
                      </span>
                    )}
                    {currentDoc.status === 'none' && (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                        BELUM DIUNGGAH
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{req.label}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{req.desc}</p>
              </div>

              {currentDoc.url ? (
                <div className="space-y-3 pt-2">
                  <div className="h-32 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                    {currentDoc.fileType === 'application/pdf' || currentDoc.url.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-2 px-4">
                        <div className="w-10 h-12 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-sm">
                          <div className="text-[10px] font-black text-red-600 mb-0.5">PDF</div>
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 truncate w-full text-center">
                          {currentDoc.fileName || 'Dokumen PDF'}
                        </span>
                      </div>
                    ) : (
                      <img 
                        src={currentDoc.url} 
                        alt={req.label} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a 
                        href={currentDoc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white text-slate-900 shadow-md hover:bg-slate-100 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="p-2 rounded-xl bg-red-600 text-white shadow-md hover:bg-red-700 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/30 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Pilih File / Unggah</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (Maks 5MB)</span>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => handleUpload(req.id, e)} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
