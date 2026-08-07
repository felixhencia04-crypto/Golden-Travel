import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Lock, CreditCard, Bell, KeyRound, CheckCircle2, 
  Copy, Sparkles, Building2, Smartphone, Save, Eye, EyeOff, Mail,
  AlertCircle, ShieldCheck, MapPin, Briefcase, RefreshCw, Check, Hash, Award
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface MitraPengaturanAkunProps {
  profile: any;
  dbUser: any;
  mitraStatus: string | null;
  refreshData: () => Promise<any>;
}

export default function MitraPengaturanAkun({
  profile,
  dbUser,
  mitraStatus,
  refreshData
}: MitraPengaturanAkunProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'rekening' | 'keamanan' | 'notifikasi'>('profil');

  // Form states for Profil & Identitas
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nik, setNik] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [kota, setKota] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states for Rekening Komisi
  const [namaBank, setNamaBank] = useState('');
  const [noRekening, setNoRekening] = useState('');
  const [namaPemilikRekening, setNamaPemilikRekening] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Form states for Keamanan & Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Form states for Notifikasi Preferences
  const [notifWaJamaah, setNotifWaJamaah] = useState(true);
  const [notifWaKomisi, setNotifWaKomisi] = useState(true);
  const [notifEmailPromo, setNotifEmailPromo] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);

  // Populate form from existing profile or dbUser
  useEffect(() => {
    if (profile || dbUser) {
      setNamaLengkap(profile?.namaLengkap || profile?.fullName || dbUser?.name || '');
      setEmail(profile?.email || dbUser?.email || '');
      setWhatsapp(profile?.whatsapp || profile?.noWa || dbUser?.phone || '');
      setNik(profile?.nik || '');
      setPekerjaan(profile?.pekerjaan || '');
      setAlamatLengkap(profile?.alamatLengkap || '');
      setProvinsi(profile?.provinsi || '');
      setKota(profile?.kota || '');

      setNamaBank(profile?.namaBank || '');
      setNoRekening(profile?.noRekening || '');
      setNamaPemilikRekening(profile?.namaPemilikRekening || profile?.namaLengkap || dbUser?.name || '');
    }
  }, [profile, dbUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }
    setIsSavingProfile(true);
    try {
      await api.post('/mitra/profile', {
        namaLengkap,
        whatsapp,
        nik,
        pekerjaan,
        alamatLengkap,
        provinsi,
        kota
      });
      toast.success('Profil dan informasi kontak berhasil diperbarui!');
      await refreshData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal memperbarui profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBank || !noRekening || !namaPemilikRekening) {
      toast.error('Mohon lengkapi seluruh data rekening bank komisi');
      return;
    }
    setIsSavingBank(true);
    try {
      await api.post('/mitra/profile', {
        namaBank,
        noRekening,
        namaPemilikRekening
      });
      toast.success('Rekening bank pembayaran komisi berhasil diperbarui!');
      await refreshData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan data rekening');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Masukkan password lama Anda');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok');
      return;
    }

    setIsChangingPass(true);
    try {
      await api.post('/mitra/change-password', {
        oldPassword,
        newPassword
      });
      toast.success('Kata sandi berhasil diperbarui!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal memperbarui kata sandi');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleCopyPartnerId = () => {
    const partnerId = dbUser?.id || profile?.userId || 'MITRA-GOLDEN';
    navigator.clipboard.writeText(partnerId);
    setIsCopiedId(true);
    toast.success('ID Mitra berhasil disalin!');
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  // Password strength meter
  const getPassStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 33, label: 'Lemah', color: 'bg-red-500' };
    if (score <= 4) return { score: 66, label: 'Sedang', color: 'bg-amber-500' };
    return { score: 100, label: 'Kuat & Aman', color: 'bg-emerald-500' };
  };

  const strength = getPassStrength(newPassword);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white shadow-xl shadow-emerald-950/20 border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-emerald-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/20 shrink-0 border-2 border-white/20">
              {namaLengkap ? namaLengkap.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black font-playfair text-white">
                  {namaLengkap || 'Mitra Golden Travel'}
                </h2>
                {mitraStatus === 'active' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Aktif & Terverifikasi
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Menunggu Verifikasi
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100/80 font-medium">
                Kelola profil keagenan, rekening pencairan komisi, dan keamanan akun Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">ID Mitra Resmi</div>
              <div className="text-xs font-mono font-bold text-white">{dbUser?.id || profile?.userId || 'ID: 00000000'}</div>
            </div>
            <button
              type="button"
              onClick={handleCopyPartnerId}
              className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Salin ID Mitra"
            >
              {isCopiedId ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('profil')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
            activeSubTab === 'profil'
              ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 border-l-4 border-amber-400'
              : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
          }`}
        >
          <User className={`w-4 h-4 ${activeSubTab === 'profil' ? 'text-amber-300' : 'text-emerald-700'}`} />
          Profil & Identitas
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rekening')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
            activeSubTab === 'rekening'
              ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 border-l-4 border-amber-400'
              : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${activeSubTab === 'rekening' ? 'text-amber-300' : 'text-emerald-700'}`} />
          Rekening Komisi
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('keamanan')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
            activeSubTab === 'keamanan'
              ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 border-l-4 border-amber-400'
              : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
          }`}
        >
          <Lock className={`w-4 h-4 ${activeSubTab === 'keamanan' ? 'text-amber-300' : 'text-emerald-700'}`} />
          Keamanan & Password
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifikasi')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shrink-0 cursor-pointer ${
            activeSubTab === 'notifikasi'
              ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 border-l-4 border-amber-400'
              : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
          }`}
        >
          <Bell className={`w-4 h-4 ${activeSubTab === 'notifikasi' ? 'text-amber-300' : 'text-emerald-700'}`} />
          Notifikasi
        </button>
      </div>

      {/* SUBTAB 1: PROFIL & IDENTITAS */}
      {activeSubTab === 'profil' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-800" /> Informasi Pribadi & Keagenan
                </h3>
                <p className="text-xs text-slate-400 font-medium">Perbarui data profil agar sesuai dengan dokumen identitas resmi</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                Mitra Resmi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" /> Nama Lengkap (Sesuai KTP)
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-700" /> Alamat Email (Login)
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 font-mono text-sm cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">Email akun tidak dapat diubah secara mandiri.</span>
              </div>

              {/* WhatsApp / HP */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700" /> Nomor WhatsApp Aktif
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Contoh: 0812182727234"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                />
              </div>

              {/* NIK */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-700" /> NIK KTP (16 Digit)
                </label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="16 digit NIK sesuai KTP"
                  maxLength={16}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-mono text-sm transition-all"
                />
              </div>

              {/* Pekerjaan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-700" /> Pekerjaan Utama
                </label>
                <input
                  type="text"
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value)}
                  placeholder="Contoh: Wiraswasta, Pegawai Swasta"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                />
              </div>

              {/* Provinsi / Kota */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" /> Provinsi
                  </label>
                  <input
                    type="text"
                    value={provinsi}
                    onChange={(e) => setProvinsi(e.target.value)}
                    placeholder="Jawa Barat"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={kota}
                    onChange={(e) => setKota(e.target.value)}
                    placeholder="Bandung"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                  />
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" /> Alamat Domisili Lengkap
                </label>
                <textarea
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  rows={3}
                  placeholder="Jl. Raya Utama No. 123, Kelurahan, Kecamatan..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-300" /> Simpan Perubahan Profil
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 2: REKENING BANK KOMISI */}
      {activeSubTab === 'rekening' && (
        <form onSubmit={handleSaveBank} className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-800" /> Rekening Bank Pembayaran Komisi
                </h3>
                <p className="text-xs text-slate-400 font-medium">Rekening ini digunakan oleh Tim Keuangan Golden Travel untuk mencairkan komisi keagenan Anda</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                Sistem Payout Otomatis
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Perhatian Penting:</strong> Pastikan Nama Pemilik Rekening sesuai dengan nama yang terdaftar di buku tabungan bank Anda. Ketidaksesuaian nama dapat menghambat proses transfer komisi.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Nama Bank */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" /> Nama Bank
                </label>
                <select
                  value={namaBank}
                  onChange={(e) => setNamaBank(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                  required
                >
                  <option value="">-- Pilih Bank --</option>
                  <option value="BANK MANDIRI">BANK MANDIRI</option>
                  <option value="BANK BCA">BANK BCA</option>
                  <option value="BANK BNI">BANK BNI</option>
                  <option value="BANK BRI">BANK BRI</option>
                  <option value="BANK BSI">BANK SYARIAH INDONESIA (BSI)</option>
                  <option value="BANK CIMB NIAGA">BANK CIMB NIAGA</option>
                  <option value="BANK MUAMALAT">BANK MUAMALAT</option>
                  <option value="BANK PERMATA">BANK PERMATA</option>
                  <option value="BANK LAINNYA">BANK LAINNYA</option>
                </select>
              </div>

              {/* Nomor Rekening */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" /> Nomor Rekening Bank
                </label>
                <input
                  type="text"
                  value={noRekening}
                  onChange={(e) => setNoRekening(e.target.value)}
                  placeholder="Contoh: 1230009876543"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-mono text-sm transition-all"
                  required
                />
              </div>

              {/* Nama Pemilik Rekening */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" /> Nama Pemilik Rekening (Atas Nama)
                </label>
                <input
                  type="text"
                  value={namaPemilikRekening}
                  onChange={(e) => setNamaPemilikRekening(e.target.value)}
                  placeholder="Sesuai di buku tabungan"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Preview Card */}
            {namaBank && noRekening && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-amber-300 text-[10px] font-black uppercase tracking-widest">
                  <span>Kartu Rekening Terdaftar</span>
                  <span>Golden Travel Partner</span>
                </div>
                <div className="text-xl font-mono font-bold tracking-wider text-white">
                  {noRekening.replace(/(\d{4})/g, '$1 ').trim()}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-300 font-bold uppercase">Atas Nama</div>
                    <div className="font-bold text-white uppercase">{namaPemilikRekening}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-300 font-bold uppercase">Bank</div>
                    <div className="font-bold text-amber-300 uppercase">{namaBank}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingBank}
                className="px-8 py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSavingBank ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-300" /> Simpan Rekening Bank
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 3: KEAMANAN & PASSWORD */}
      {activeSubTab === 'keamanan' && (
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-800" /> Keamanan Akun & Ubah Kata Sandi
                </h3>
                <p className="text-xs text-slate-400 font-medium">Perbarui kata sandi secara berkala untuk perlindungan maksimal akun keagenan Anda</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Dekripsi Aman
              </span>
            </div>

            <div className="max-w-xl space-y-5">
              {/* Password Lama */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-700" /> Password Saat Ini (Lama)
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama Anda"
                    className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700" /> Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {newPassword && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Kekuatan Kata Sandi:</span>
                      <span className="font-bold text-slate-800">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password Baru */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-medium text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex justify-start pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-8 py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isChangingPass ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> Mengubah Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" /> Perbarui Kata Sandi
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 4: PREFERENSI NOTIFIKASI */}
      {activeSubTab === 'notifikasi' && (
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-800" /> Preferensi Notifikasi & Komunikasi
              </h3>
              <p className="text-xs text-slate-400 font-medium">Atur kanal notifikasi untuk menerima kabar terbaru pendaftaran jamaah dan pencairan komisi</p>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between pt-4 first:pt-0">
              <div className="space-y-1 pr-4">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700" /> Notifikasi WhatsApp Registrasi Jamaah
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Kirim pesan WhatsApp otomatis ketika ada calon jamaah baru mendaftar menggunakan referral / tautan agen Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifWaJamaah(!notifWaJamaah)}
                className={`w-14 h-8 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                  notifWaJamaah ? 'bg-emerald-800' : 'bg-slate-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  notifWaJamaah ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-1 pr-4">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" /> Notifikasi WhatsApp Pencairan Komisi
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Terima pemberitahuan saat komisi keagenan Anda berhasil diproses atau ditransfer oleh tim keuangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifWaKomisi(!notifWaKomisi)}
                className={`w-14 h-8 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                  notifWaKomisi ? 'bg-emerald-800' : 'bg-slate-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  notifWaKomisi ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-1 pr-4">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-700" /> Email Broadcast Info Program Kemitraan
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Dapatkan buletin mingguan perihal jadwal keberangkatan umroh promo, bonus komisi, dan materi pemasaran.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifEmailPromo(!notifEmailPromo)}
                className={`w-14 h-8 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                  notifEmailPromo ? 'bg-emerald-800' : 'bg-slate-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  notifEmailPromo ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Pengaturan notifikasi langsung disimpan secara otomatis</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Aktif</span>
          </div>
        </div>
      )}
    </div>
  );
}
