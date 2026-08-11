import React, { useState } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { 
  User, MapPin, Building2, CreditCard, Upload, 
  CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck,
  Calendar, Phone, Mail, FileText, Info, Receipt,
  Copy, Check
} from 'lucide-react';

interface MitraOnboardingFormProps {
  onComplete: () => void;
  initialData?: any;
}

export default function MitraOnboardingForm({ onComplete, initialData }: MitraOnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    namaLengkap: initialData?.namaLengkap || '',
    alamatLengkap: initialData?.alamatLengkap || '',
    nik: initialData?.nik || '',
    tempatLahir: initialData?.tempatLahir || '',
    tanggalLahir: initialData?.tanggalLahir || '',
    jenisKelamin: initialData?.jenisKelamin || '',
    statusPerkawinan: initialData?.statusPerkawinan || '',
    pekerjaan: initialData?.pekerjaan || '',
    provinsi: initialData?.provinsi || '',
    kota: initialData?.kota || '',
    kecamatan: initialData?.kecamatan || '',
    kodePos: initialData?.kodePos || '',
    namaBank: initialData?.namaBank || '',
    noRekening: initialData?.noRekening || '',
    namaPemilikRekening: initialData?.namaPemilikRekening || '',
    npwp: initialData?.npwp || '',
    whatsapp: initialData?.whatsapp || '',
    fotoKtp: '',
    selfieKtp: '',
    fotoNpwp: '',
    fotoBukuTabungan: '',
    buktiTransfer: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin!`);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimension 1200px
            const MAX_DIM = 1200;
            if (width > height && width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');
            
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    field: 'fotoKtp' | 'selfieKtp' | 'fotoNpwp' | 'fotoBukuTabungan' | 'buktiTransfer'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size, if > 2MB or image type, compress it
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file);
          setFormData(prev => ({ ...prev, [field]: compressed }));
        } catch (error) {
          console.error('Compression failed:', error);
          // Fallback to original
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => ({ ...prev, [field]: reader.result as string }));
          };
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.buktiTransfer) {
      toast.error('Mohon unggah foto bukti transfer biaya pendaftaran administrasi terlebih dahulu.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        namaPemilikRekening: formData.namaPemilikRekening.trim() || formData.namaLengkap.trim()
      };
      await api.post('/mitra/profile', payload);
      toast.success('Data pendaftaran & bukti transfer mitra berhasil dikirim. Mohon tunggu verifikasi admin.');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengirim data pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-playfair font-black text-slate-900">Kelengkapan Profil Mitra</h2>
              <p className="text-slate-500 font-medium mt-1">Lengkapi data Anda untuk mengaktifkan akses penuh panel kemitraan.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-100">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Verifikasi Keamanan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { s: 1, title: 'Biodata Diri', desc: 'Data Diri & Alamat' },
              { s: 2, title: 'Dokumen Legal', desc: 'KTP, Selfie & NPWP' },
              { s: 3, title: 'Informasi Bank', desc: 'Rekening Komisi' },
              { s: 4, title: 'Biaya Administrasi', desc: 'Resi Transfer Rp 350rb' },
            ].map((item) => (
              <button
                key={item.s}
                type="button"
                onClick={() => setStep(item.s)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  step === item.s
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-900/20'
                    : step > item.s
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    step === item.s
                      ? 'bg-amber-400 text-emerald-950 shadow-xs'
                      : step > item.s
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step > item.s ? <CheckCircle2 className="w-4 h-4" /> : item.s}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${
                      step === item.s ? 'text-amber-300' : step > item.s ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      Tahap 0{item.s}
                    </p>
                    <p className="text-xs font-bold truncate leading-tight mt-0.5">{item.title}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Nama Lengkap Sesuai KTP
                </label>
                <input 
                  type="text"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleInputChange}
                  placeholder="Masukkan Nama Lengkap Anda"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp Aktif
                </label>
                <input 
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Nomor Induk Kependudukan (NIK)
                  </label>
                  <input 
                    type="text"
                    name="nik"
                    value={formData.nik}
                    onChange={handleInputChange}
                    placeholder="16 Digit Nomor KTP Anda"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Nomor NPWP (Opsional)
                  </label>
                  <input 
                    type="text"
                    name="npwp"
                    value={formData.npwp}
                    onChange={handleInputChange}
                    placeholder="15 Digit Nomor NPWP"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Tempat Lahir
                  </label>
                  <input 
                    type="text"
                    name="tempatLahir"
                    value={formData.tempatLahir}
                    onChange={handleInputChange}
                    placeholder="Contoh: Jakarta"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal Lahir
                  </label>
                  <input 
                    type="date"
                    name="tanggalLahir"
                    value={formData.tanggalLahir}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Jenis Kelamin
                  </label>
                  <select 
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium appearance-none"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Status Perkawinan
                  </label>
                  <select 
                    name="statusPerkawinan"
                    value={formData.statusPerkawinan}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium appearance-none"
                  >
                    <option value="">Pilih Status</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Pekerjaan Saat Ini
                </label>
                <input 
                  type="text"
                  name="pekerjaan"
                  value={formData.pekerjaan}
                  onChange={handleInputChange}
                  placeholder="Contoh: Karyawan Swasta, Pengusaha, PNS, dll"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Provinsi
                  </label>
                  <input 
                    type="text"
                    name="provinsi"
                    value={formData.provinsi}
                    onChange={handleInputChange}
                    placeholder="Contoh: Kepulauan Riau"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Kota / Kabupaten
                  </label>
                  <input 
                    type="text"
                    name="kota"
                    value={formData.kota}
                    onChange={handleInputChange}
                    placeholder="Contoh: Batam"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Kecamatan
                  </label>
                  <input 
                    type="text"
                    name="kecamatan"
                    value={formData.kecamatan}
                    onChange={handleInputChange}
                    placeholder="Nama Kecamatan"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Kode Pos
                  </label>
                  <input 
                    type="text"
                    name="kodePos"
                    value={formData.kodePos}
                    onChange={handleInputChange}
                    placeholder="5 Digit Kode Pos"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Alamat Lengkap Sesuai KTP
                </label>
                <textarea 
                  name="alamatLengkap"
                  value={formData.alamatLengkap}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Nama jalan, nomor rumah, RT/RW, Kecamatan, Kota..."
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 transition-all outline-none font-medium"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">Instruksi Upload Dokumen</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Pastikan foto dokumen terlihat jelas, tidak terpotong, dan pencahayaan cukup. Wajib mengunggah foto KTP dan Foto Selfie memegang KTP.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Foto KTP Asli
                  </label>
                  <div className={`relative h-56 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center ${
                    formData.fotoKtp ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'fotoKtp')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {formData.fotoKtp ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-emerald-900">KTP Terpilih</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 mb-3">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Pilih Foto KTP</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Foto Selfie + KTP
                  </label>
                  <div className={`relative h-56 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center ${
                    formData.selfieKtp ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'selfieKtp')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {formData.selfieKtp ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-emerald-900">Selfie Terpilih</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 mb-3">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Pilih Foto Selfie</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Foto NPWP
                  </label>
                  <div className={`relative h-56 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center ${
                    formData.fotoNpwp ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'fotoNpwp')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {formData.fotoNpwp ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-emerald-900">NPWP Terpilih</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 mb-3">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Pilih Foto NPWP</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Foto Buku Tabungan
                  </label>
                  <div className={`relative h-56 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center ${
                    formData.fotoBukuTabungan ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'fotoBukuTabungan')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {formData.fotoBukuTabungan ? (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-emerald-900">Buku Tabungan Terpilih</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 mb-3">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Pilih Foto Buku Tabungan</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Rekening Komisi</h3>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    Mohon masukkan nomor rekening Anda dengan teliti untuk proses bagi hasil kemitraan.
                  </p>
                </div>
              </div>

              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Bank</label>
                  <select 
                    name="namaBank"
                    value={formData.namaBank}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-medium"
                  >
                    <option value="">-- Pilih Bank --</option>
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nomor Rekening</label>
                  <input 
                    type="text"
                    name="noRekening"
                    value={formData.noRekening}
                    onChange={handleInputChange}
                    placeholder="Contoh: 1234567890"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Pemilik Rekening</label>
                  <input 
                    type="text"
                    name="namaPemilikRekening"
                    value={formData.namaPemilikRekening}
                    onChange={handleInputChange}
                    placeholder="Nama Lengkap Sesuai Buku Tabungan"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Card Biaya Pendaftaran */}
              <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 p-6 sm:p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Receipt className="w-48 h-48 text-amber-300" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                    <Receipt className="w-3.5 h-3.5" /> Biaya Pendaftaran Administrasi Kemitraan
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-b border-white/10 pb-6">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-playfair font-black text-white">Biaya Registrasi Resmi Mitra</h3>
                      <p className="text-xs sm:text-sm text-emerald-200/80 font-medium mt-1">
                        Biaya pendaftaran berlaku 1 kali untuk perlengkapan dan lisensi kemitraan resmi Golden Travel.
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-emerald-300 block">Investasi Syiar</span>
                      <span className="text-2xl sm:text-3xl font-playfair font-black text-amber-300">Berkah</span>
                    </div>
                  </div>

                  {/* List Fasilitas Perlengkapan */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-200">
                      Fasilitas Perlengkapan Yang Didapatkan Mitra Golden Travel:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: 'Spanduk Kemitraan', desc: 'Spanduk promosi resmi Golden Travel' },
                        { label: 'ID Card Mitra Resmi', desc: 'Kartu identitas kemitraan terverifikasi' },
                        { label: 'Kartu Nama Profesional', desc: 'Kartu nama cetak edisi mitra resmi' },
                        { label: 'Brosur Paket Umroh & Haji', desc: 'Materi cetak promosi pendaftaran jemaah' },
                        { label: 'Formulir Pendaftaran Jemaah', desc: 'Formulir fisik pendaftaran calon jemaah' },
                        { label: 'MOU Kerjasama (SPK)', desc: 'Surat perjanjian kerjasama resmi' },
                      ].map((kit, idx) => (
                        <div key={idx} className="bg-white/10 hover:bg-white/15 transition-all p-3.5 rounded-2xl border border-white/10 flex items-start gap-3">
                          <div className="w-7 h-7 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                            <Check className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white leading-tight">{kit.label}</div>
                            <div className="text-[10px] text-emerald-200/70 mt-0.5">{kit.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruksi Transfer Bank */}
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Rekening Resmi Tujuan Transfer</h4>
                    <p className="text-xs text-slate-500 font-medium">Silakan lakukan transfer pendaftaran administrasi ke rekening resmi PT Golden Tour Haramain di bawah ini:</p>
                  </div>
                </div>

                <div className="max-w-xl mx-auto">
                  {/* Bank Mandiri - Rekening Tunggal */}
                  <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4 relative group hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1 bg-blue-100 text-blue-800 text-xs font-black rounded-lg">BANK MANDIRI</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">(Rekening Resmi Perusahaan)</span>
                      </div>
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Rekening</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 mt-1 flex items-center justify-between gap-4">
                        <span className="tracking-wider">1090064995673</span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('1090064995673', 'Nomor Rekening Mandiri')}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 rounded-xl transition-colors flex items-center gap-1.5 active:scale-95 shrink-0 shadow-xs"
                        >
                          <Copy className="w-4 h-4" /> Salin Rekening
                        </button>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-xs font-medium text-slate-600 flex items-center justify-between">
                      <span>Atas Nama Rekening:</span>
                      <strong className="text-slate-900 font-bold uppercase">PT. GOLDEN TOUR HARAMAIN</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    <div className="text-xs text-amber-900 font-medium">
                      Mohon mentransfer sesuai instruksi admin agar proses verifikasi tim keuangan berjalan otomatis & cepat.
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Unggah Bukti Transfer */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-800" /> Unggah Bukti Transfer / Resi Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Format: JPG, PNG (Maks 5MB)</span>
                </div>

                <div className={`relative min-h-[200px] rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center ${
                  formData.buktiTransfer ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
                }`}>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'buktiTransfer')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {formData.buktiTransfer ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">Bukti Transfer Berhasil Diunggah</p>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">Klik area ini jika ingin mengganti foto resi transfer</p>
                      </div>
                      {formData.buktiTransfer.startsWith('data:image') && (
                        <div className="max-w-[220px] mx-auto mt-2 rounded-xl overflow-hidden border border-emerald-200 shadow-sm bg-white p-1">
                          <img src={formData.buktiTransfer} alt="Bukti Transfer" className="max-h-36 object-contain mx-auto rounded-lg" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-800 mx-auto">
                        <Upload className="w-8 h-8 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Pilih / Unggah Foto Resi Bukti Transfer</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Unggah tangkapan layar (screenshot) m-Banking atau foto struk ATM bukti transfer Anda
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>

          {step < 4 ? (
            <button 
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-900 text-white font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20"
            >
              Lanjutkan <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-10 py-3 rounded-xl bg-emerald-900 text-white font-bold hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/30"
            >
              {loading ? 'Mengirim Data...' : 'Kirim Data Pendaftaran & Bukti Transfer'} <CheckCircle2 className="w-5 h-5 text-amber-300" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center mt-8 text-slate-400 text-xs font-medium">
        Seluruh data Anda dilindungi oleh protokol enkripsi SSL 256-bit dan kebijakan privasi PT. Golden Tour Haramain.
      </p>
    </div>
  );
}
