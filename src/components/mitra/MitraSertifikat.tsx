import React, { useState, useEffect } from 'react';
import { 
  Award, Search, Download, Eye, FileText, CheckCircle2, Clock, 
  RefreshCw, User, Sparkles, Filter, ChevronRight, AlertCircle, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { filterJamaahForCurrentMitra, getScopedKey } from '../../utils/mitraStorage';

interface MitraSertifikatProps {
  jamaahList?: any[];
}

export default function MitraSertifikat({ jamaahList = [] }: MitraSertifikatProps) {
  const [localJamaahList, setLocalJamaahList] = useState<any[]>(jamaahList);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'pending'>('all');

  const loadJamaahDatabase = async () => {
    setLoading(true);
    try {
      let combined: any[] = [];

      // 1. Fetch real Jamaah list from backend database
      const dbList = await api.get('/mitra/jamaah/list').catch(() => api.get('/mitra/jamaah').catch(() => []));
      if (Array.isArray(dbList) && dbList.length > 0) {
        combined = [...dbList];
      }

      // 2. Merge with jamaahList prop from parent hook
      if (jamaahList && jamaahList.length > 0) {
        jamaahList.forEach((j: any) => {
          const jName = (j.userName || j.namaLengkap || j.fullName || j.name || '').trim();
          if (jName && !combined.some(c => c.id === j.id || (c.userName && c.userName.trim() === jName))) {
            combined.push(j);
          }
        });
      }

      // 3. Merge with scoped local storage pax list
      const scopedKey = getScopedKey('mitra_saved_pax_list');
      const savedPaxStr = localStorage.getItem(scopedKey);
      if (savedPaxStr) {
        const savedPax = JSON.parse(savedPaxStr);
        if (Array.isArray(savedPax)) {
          savedPax.forEach((sp: any) => {
            const spName = (sp.userName || sp.namaLengkap || sp.fullName || sp.name || '').trim();
            if (spName && !combined.some(c => c.id === sp.id || (c.userName && c.userName.trim() === spName))) {
              combined.push(sp);
            }
          });
        }
      }

      // 4. Merge with filtered central database
      const centralDbStr = localStorage.getItem('mitra_jamaah_database');
      if (centralDbStr) {
        try {
          const centralDb = JSON.parse(centralDbStr);
          const filtered = filterJamaahForCurrentMitra(centralDb);
          filtered.forEach((cItem: any) => {
            const cName = (cItem.userName || cItem.namaLengkap || cItem.fullName || cItem.name || '').trim();
            if (cName && !combined.some(c => c.id === cItem.id || (c.userName && c.userName.trim() === cName))) {
              combined.push(cItem);
            }
          });
        } catch (e) {}
      }

      // Ensure clean valid items only
      const validList = combined.filter(j => {
        const name = (j.fullName || j.namaLengkap || j.userName || j.name || '').trim();
        return name !== '' && !name.startsWith('Jamaah #');
      });

      setLocalJamaahList(validList);
    } catch (e) {
      console.error('Failed loading jamaah database', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJamaahDatabase();

    const handleSync = () => {
      loadJamaahDatabase();
    };

    window.addEventListener('mitra_jamaah_updated', handleSync);
    window.addEventListener('storage', handleSync);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('mitra_catalog_realtime');
      bc.onmessage = (e) => {
        if (e.data?.type === 'JAMAAH_UPDATED' || e.data?.type === 'CERTIFICATE_UPDATED') {
          loadJamaahDatabase();
        }
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('mitra_jamaah_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      if (bc) bc.close();
    };
  }, [jamaahList]);

  // Download Base64 or File URL
  const handleDownloadCert = (certData: any, defaultName: string) => {
    try {
      const link = document.createElement('a');
      link.href = certData.data || certData.url || certData;
      link.download = certData.name || `Sertifikat_${defaultName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Unduhan sertifikat ${defaultName} dimulai!`);
    } catch (e) {
      if (certData.data || certData.url) {
        window.open(certData.data || certData.url, '_blank');
      }
    }
  };

  // Preview Cert in new tab
  const handlePreviewCert = (certData: any) => {
    const fileUrl = certData.data || certData.url || certData;
    if (fileUrl) {
      const w = window.open();
      if (w) {
        w.document.write(`<iframe src="${fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      } else {
        window.open(fileUrl, '_blank');
      }
    }
  };

  // Filter List
  const filteredList = localJamaahList.filter(jamaah => {
    const isIssued = !!(jamaah.docFiles?.sertifikat || jamaah.isCertIssued || jamaah.certificateUrl);
    if (statusFilter === 'issued' && !isIssued) return false;
    if (statusFilter === 'pending' && isIssued) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (jamaah.fullName || jamaah.namaLengkap || '').toLowerCase();
    const nik = (jamaah.nik || '').toLowerCase();
    const pkg = (jamaah.paketName || jamaah.packageName || '').toLowerCase();
    return name.includes(q) || nik.includes(q) || pkg.includes(q);
  });

  const totalIssuedCount = localJamaahList.filter(j => !!(j.docFiles?.sertifikat || j.isCertIssued || j.certificateUrl)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-400/30">
              <Award className="w-3.5 h-3.5 text-amber-400" /> E-SERTIFIKAT DIGITAL JAMAAH
            </div>
            <h2 className="text-2xl sm:text-4xl font-playfair font-bold text-white leading-snug">
              Daftar Sertifikat Ibadah Resmi
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed font-medium">
              Akses dan unduh e-sertifikat pelaksanaan ibadah Umroh/Haji untuk jemaah terdaftar di bawah bimbingan Agen Mitra Anda.
            </p>
          </div>

          <button
            onClick={loadJamaahDatabase}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20 flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
            <User className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Jamaah Anda</p>
            <p className="text-2xl font-black text-slate-900">{localJamaahList.length} <span className="text-xs font-medium text-slate-500">Orang</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sertifikat Terbit</p>
            <p className="text-2xl font-black text-slate-900">{totalIssuedCount} <span className="text-xs font-medium text-slate-500">E-Sertifikat</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-800 border border-blue-100">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Penerbitan</p>
            <p className="text-sm font-bold text-emerald-900 mt-1">Resmi dari Admin Golden Tour</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama jamaah atau paket..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50/80"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({localJamaahList.length})
          </button>
          <button
            onClick={() => setStatusFilter('issued')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'issued' ? 'bg-emerald-900 text-amber-300 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sertifikat Terbit ({totalIssuedCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'pending' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Terbit ({localJamaahList.length - totalIssuedCount})
          </button>
        </div>
      </div>

      {/* Main Table / Cards List */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
        {filteredList.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h4 className="font-playfair font-bold text-slate-800 text-base">Tidak Ada Data Sertifikat Jemaah</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Penerbitan e-sertifikat dilakukan oleh Admin setelah kepulangan jemaah dari tanah suci.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map(jamaah => {
              const cert = jamaah.docFiles?.sertifikat;
              const isIssued = !!(cert || jamaah.isCertIssued || jamaah.certificateUrl);
              const recipientName = cert?.recipientName || jamaah.fullName || jamaah.namaLengkap || 'Nama Jamaah';
              const packageName = jamaah.paketName || jamaah.packageName || 'Paket Umroh Reguler';

              return (
                <div 
                  key={jamaah.id}
                  className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between space-y-5 ${
                    isIssued ? 'bg-gradient-to-b from-emerald-50/60 to-white border-emerald-300 shadow-sm' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="p-3 rounded-2xl bg-white border border-slate-200 text-amber-500 shadow-xs">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isIssued ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isIssued ? <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                        {isIssued ? 'SERTIFIKAT TERBIT' : 'BELUM TERBIT'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-playfair font-bold text-base text-slate-900 leading-snug">{recipientName}</h4>
                      <p className="text-xs font-bold text-emerald-800 mt-1">{packageName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">NIK: {jamaah.nik || '-'}</p>
                    </div>
                  </div>

                  {/* Certificate Action Section */}
                  {isIssued ? (
                    <div className="bg-white p-4 rounded-2xl border border-emerald-200 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{cert?.name || `E-Sertifikat ${recipientName}.pdf`}</p>
                          <p className="text-[10px] text-slate-400">{cert?.uploadedAt || 'Terbit'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handlePreviewCert(cert || jamaah.certificateUrl)}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" /> Pratinjau
                        </button>
                        <button
                          onClick={() => handleDownloadCert(cert || jamaah.certificateUrl, recipientName)}
                          className="py-2 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" /> Unduh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-500 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" /> Proses Penerbitan
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        E-Sertifikat digital akan diterbitkan oleh Admin setelah pelaksanaan ibadah selesai.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
