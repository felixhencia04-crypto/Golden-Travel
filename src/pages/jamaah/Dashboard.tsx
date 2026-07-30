import React from 'react';
import { useRegistrasi } from '../../hooks/useRegistrasi';
import { CheckCircle2, Clock, AlertCircle, ArrowRight, CreditCard, Upload, Sparkles, Plane, Award } from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { dbUser, registration, loading } = useRegistrasi();

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  const currentStatus = dbUser?.status || 'DRAFT';
  
  const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    'DRAFT': { label: 'Pendaftaran Dimulai', color: 'bg-gray-100 text-gray-600', icon: Clock },
    'PILIH_PAKET': { label: 'Menunggu Pilihan Paket', color: 'bg-blue-100 text-blue-600', icon: Clock },
    'ISI_BIODATA': { label: 'Pengisian Biodata', color: 'bg-orange-100 text-orange-600', icon: AlertCircle },
    'UPLOAD_DOKUMEN': { label: 'Menunggu Dokumen', color: 'bg-orange-100 text-orange-600', icon: Upload },
    'VERIFIKASI_DOKUMEN': { label: 'Verifikasi Dokumen', color: 'bg-yellow-100 text-yellow-600', icon: Clock },
    'CICIL_BAYAR': { label: 'Menunggu Pembayaran', color: 'bg-blue-100 text-blue-600', icon: CreditCard },
    'VERIFIKASI_BAYAR': { label: 'Verifikasi Pembayaran', color: 'bg-yellow-100 text-yellow-600', icon: Clock },
    'LUNAS': { label: 'Sudah Lunas', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
    'SIAP_BERANGKAT': { label: 'Siap Berangkat', color: 'bg-green-100 text-green-600', icon: Sparkles },
    'BERANGKAT': { label: 'Sedang Beribadah', color: 'bg-indigo-100 text-indigo-600', icon: Plane },
    'SELESAI': { label: 'Selesai', color: 'bg-green-100 text-green-600', icon: Award },
  };

  const getProgress = () => {
    const statuses = [
      'DRAFT', 'PILIH_PAKET', 'ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 
      'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'
    ];
    const index = statuses.indexOf(currentStatus);
    return Math.round(((index + 1) / statuses.length) * 100);
  };

  const getNextTasks = () => {
    switch (currentStatus) {
      case 'DRAFT': return ['Pilih paket Umroh/Haji yang tersedia'];
      case 'PILIH_PAKET': return ['Lengkapi formulir pendaftaran awal'];
      case 'ISI_BIODATA': return ['Isi biodata lengkap jamaah', 'Unggah scan KTP & KK'];
      case 'UPLOAD_DOKUMEN': return ['Unggah foto paspor', 'Unggah buku nikah (jika ada)'];
      case 'VERIFIKASI_DOKUMEN': return ['Menunggu admin memverifikasi dokumen Anda'];
      case 'CICIL_BAYAR': return ['Lakukan pembayaran DP minimal Rp 1.500.000'];
      case 'VERIFIKASI_BAYAR': return ['Menunggu admin memverifikasi bukti transfer'];
      case 'LUNAS': return ['Tunggu jadwal manasik keberangkatan'];
      case 'SIAP_BERANGKAT': return ['Ambil perlengkapan di kantor pusat'];
      default: return ['Pantau terus timeline keberangkatan Anda'];
    }
  };

  const config = statusConfig[currentStatus] || statusConfig['DRAFT'];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assalamu'alaikum, {dbUser?.name}</h1>
          <p className="text-gray-500">Selamat datang kembali di portal jamaah Golden Travel.</p>
        </div>
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm ${config.color} border border-current opacity-90`}>
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </div>
      </header>

      {/* Progress Card */}
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Progres Keberangkatan</h2>
          <span className="text-2xl font-black text-gold-600">{getProgress()}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-gold-500 to-gold-600"
          />
        </div>
        <p className="text-sm text-gray-500">
          Anda sedang berada di tahap <span className="text-gray-800 font-bold">{config.label}</span>. 
          Lengkapi langkah selanjutnya untuk mempercepat proses.
        </p>
      </section>

      {/* Next Tasks */}
      <section className="bg-[#132019] text-white rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-gold-400" />
          Tugas Berikutnya
        </h2>
        <div className="space-y-4">
          {getNextTasks().map((task, idx) => (
            <div key={idx} className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-black font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-gray-200">{task}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Package Info (if exists) */}
      {registration?.package && (
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Paket Terpilih</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <img 
              src={registration.package.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80'} 
              alt={registration.package.name}
              className="w-full md:w-48 h-32 object-cover rounded-2xl"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{registration.package.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{registration.package.duration} • Keberangkatan: {registration.package.departureDate ? new Date(registration.package.departureDate).toLocaleDateString('id-ID') : 'Segera Ditentukan'}</p>
              <div className="text-2xl font-black text-gray-900">
                Rp {Number(registration.totalAmount || registration.package.price).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// End of file
