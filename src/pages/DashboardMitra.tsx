import { useLogo } from '../utils/logo';
import React, { useState, useEffect } from 'react';
import { Users, FileText, Activity, Home, LogOut, Search, Plus, Filter, MoreVertical, CreditCard, Calendar, BarChart, TrendingUp, Target, Plane, CheckCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from '../types';
import { Briefcase, Eye, Megaphone, Bell, User, Download, Image, Video, Edit2 } from 'lucide-react';
import { useMitraData } from '../hooks/useMitraData';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

export default function DashboardMitra() {
  const logoImg = useLogo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jamaah' | 'paket' | 'jadwal' | 'komisi' | 'marketing' | 'notifikasi' | 'profil'>('dashboard');
  
  const { jamaahList, stats, loading, user, refreshData } = useMitraData();
  const [packages, setPackages] = useState<any[]>([]);
  
  const fetchPackages = async () => {
    try {
      const data = await api.get('/packages');
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-matcha-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Memuat data Mitra...</p>
        </div>
      </div>
    );
  }

  const komisiList = [
    { id: 1, name: 'Bonus Sponsor - Budi Santoso', amount: 'Rp 2.000.000', date: '01 Okt 2026', status: 'Cair' },
    { id: 2, name: 'Bonus Sponsor - Siti Aminah', amount: 'Rp 1.500.000', date: '10 Nov 2026', status: 'Pending' },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-matcha-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-matcha-50 text-matcha-950 flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-6 flex items-center justify-center border-b border-white/10">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-matcha-50 rounded-full flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className="font-bold text-lg tracking-wider text-gold-400 uppercase">Mitra Panel</span>
          </Link>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <p className="text-sm text-matcha-100/60 font-light mb-1">Selamat datang,</p>
            <p className="font-semibold text-lg">Agen Perwakilan A</p>
            <div className="mt-2 inline-block px-3 py-1 bg-gold-500/20 text-gold-400 text-xs rounded-full border border-gold-500/30">
              Mitra Premium
            </div>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('jamaah')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'jamaah' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <Users className="w-5 h-5" />
              <span>Kelola Jamaah</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('paket')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'paket' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Paket Umroh & Haji</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('jadwal')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'jadwal' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <Calendar className="w-5 h-5" />
              <span>Jadwal Keberangkatan</span>
            </button>
            <button 
              onClick={() => setActiveTab('komisi')}

              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'komisi' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Lihat Komisi</span>
            </button>

            <button 
              onClick={() => setActiveTab('marketing')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'marketing' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <Megaphone className="w-5 h-5" />
              <span>Marketing Tools</span>
            </button>
            <button 
              onClick={() => setActiveTab('notifikasi')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'notifikasi' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <Bell className="w-5 h-5" />
              <span>Notifikasi</span>
            </button>
            <button 
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profil' ? 'bg-gold-500 text-matcha-950 font-semibold shadow-lg shadow-gold-500/20' : 'text-matcha-100/80 hover:bg-matcha-50/5 hover:text-matcha-950'}`}
            >
              <User className="w-5 h-5" />
              <span>Profil Saya</span>
            </button>
          </nav>

        </div>
        
        <div className="mt-auto p-6 border-t border-white/10">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 text-matcha-100/80 hover:text-matcha-950 hover:bg-matcha-50/5 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-matcha-950">
              {activeTab === 'dashboard' ? 'Overview CRM' : activeTab === 'jamaah' ? 'Kelola Jamaah' : activeTab === 'komisi' ? 'Riwayat Komisi' : activeTab === 'paket' ? 'Daftar Paket' : activeTab === 'jadwal' ? 'Jadwal Keberangkatan' : activeTab === 'marketing' ? 'Marketing Tools' : activeTab === 'notifikasi' ? 'Notifikasi' : activeTab === 'profil' ? 'Profil Saya' : 'Laporan'}
            </h1>
            <p className="text-gray-500 mt-1">
              {activeTab === 'dashboard' ? 'Ringkasan kinerja dan pencapaian Anda' : activeTab === 'paket' ? 'Lihat daftar harga, promo, dan sisa kuota paket (View Only)' : activeTab === 'jadwal' ? 'Pantau jadwal umroh dan haji beserta kuota' : activeTab === 'marketing' ? 'Download brosur, banner, dan materi promosi' : activeTab === 'notifikasi' ? 'Pengumuman dan informasi terbaru' : activeTab === 'profil' ? 'Kelola data diri dan akun Anda' : 'Pantau dan kelola pendaftaran jamaah Anda'}
            </p>
          </div>
          
          {activeTab === 'jamaah' && (
            <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-matcha-900 text-matcha-950 rounded-lg hover:bg-matcha-800 transition-colors shadow-md shadow-matcha-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Jamaah
            </button>
          )}
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Total Jamaah */}
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-matcha-50 text-matcha-700 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Jamaah</p>
                  <h3 className="text-3xl font-bold text-matcha-950">{stats?.totalJamaah || 0}</h3>
                </div>
              </div>
              
              {/* Jamaah Aktif */}
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Proses</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Jamaah Aktif</p>
                  <h3 className="text-3xl font-bold text-matcha-950">{stats?.activeJamaah || 0}</h3>
                </div>
              </div>

              {/* Jamaah Berangkat */}
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Plane className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">Selesai</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Jamaah Berangkat</p>
                  <h3 className="text-3xl font-bold text-matcha-950">0</h3>
                </div>
              </div>

              {/* Target Penjualan */}
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">0%</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Target Penjualan Tahunan</p>
                  <div className="flex items-baseline space-x-2">
                    <h3 className="text-3xl font-bold text-matcha-950">0</h3>
                    <span className="text-gray-400">/ 50 Pax</span>
                  </div>
                  <div className="w-full bg-matcha-100 rounded-full h-2 mt-3">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>

              {/* Komisi Bulan Ini */}
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between md:col-span-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gold-50 text-gold-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Komisi Bulan Ini</p>
                  <h3 className="text-3xl font-bold text-matcha-950">Rp 0</h3>
                </div>
              </div>

              {/* Total Komisi */}
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between md:col-span-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gold-50 text-gold-600 rounded-xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Komisi (Sepanjang Waktu)</p>
                  <h3 className="text-3xl font-bold text-matcha-950">Rp {Number(stats?.totalCommission || 0).toLocaleString('id-ID')}</h3>
                </div>
              </div>
            </div>

            {/* Jadwal Keberangkatan Terdekat */}
            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden mt-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-matcha-950 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gold-500" /> Jamaah Terbaru Anda
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {jamaahList.slice(0, 3).map((j) => (
                  <div key={j.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-matcha-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-matcha-950">{j.name}</h4>
                      <p className="text-gray-500 text-sm mt-1">{j.registrations?.[0]?.package?.name || 'Belum Pilih Paket'}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-matcha-700">{j.registrations?.[0]?.status || 'Draft'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center text-gold-600 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jamaah' && (
          <div className="space-y-6">
            {/* Data Table */}
            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari jamaah..." 
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-matcha-500 focus:border-matcha-500 outline-none transition-shadow"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-matcha-50 text-gray-500 text-sm">
                      <th className="p-4 font-medium border-b border-gray-100">Nama Jamaah</th>
                      <th className="p-4 font-medium border-b border-gray-100">Email</th>
                      <th className="p-4 font-medium border-b border-gray-100">Status</th>
                      <th className="p-4 font-medium border-b border-gray-100">Terdaftar Pada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jamaahList.map((j) => (
                      <tr key={j.id} className="hover:bg-matcha-50 transition-colors group">
                        <td className="p-4 border-b border-gray-50 text-matcha-950 font-medium">{j.name}</td>
                        <td className="p-4 border-b border-gray-50 text-gray-600">{j.email}</td>
                        <td className="p-4 border-b border-gray-50">
                          <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700`}>
                            {j.registrations?.[0]?.status || 'Belum Daftar'}
                          </span>
                        </td>
                        <td className="p-4 border-b border-gray-50 text-sm text-gray-500">
                          {j.createdAt ? new Date(j.createdAt).toLocaleDateString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                <span>Menampilkan 1-4 dari 4 jamaah</span>
                <div className="flex space-x-1">
                  <button className="px-3 py-1 border border-gray-200 rounded text-gray-400 cursor-not-allowed">Sebelumnya</button>
                  <button className="px-3 py-1 border border-gray-200 rounded text-gray-400 cursor-not-allowed">Selanjutnya</button>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'komisi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">Proses</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Komisi Pending</p>
                  <h3 className="text-3xl font-bold text-matcha-950">Rp 4.500.000</h3>
                </div>
              </div>
              
              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">Berhasil</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Komisi Cair (Bulan Ini)</p>
                  <h3 className="text-3xl font-bold text-matcha-950">Rp 12.000.000</h3>
                </div>
              </div>

              <div className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">Target: 50 Pax</span>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Bonus Pencapaian Target</p>
                  <h3 className="text-3xl font-bold text-matcha-950">Rp 5.000.000</h3>
                  <div className="w-full bg-matcha-100 rounded-full h-2 mt-3">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                <h3 className="text-lg font-bold text-matcha-950 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-gold-500" /> Riwayat Komisi & Bonus
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-matcha-50 text-gray-500 text-sm">
                      <th className="p-4 font-medium border-b border-gray-100">Keterangan</th>
                      <th className="p-4 font-medium border-b border-gray-100">Tanggal</th>
                      <th className="p-4 font-medium border-b border-gray-100">Nominal</th>
                      <th className="p-4 font-medium border-b border-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {komisiList.map((k) => (
                      <tr key={k.id} className="hover:bg-matcha-50 transition-colors">
                        <td className="p-4 border-b border-gray-50 text-matcha-950 font-medium">{k.name}</td>
                        <td className="p-4 border-b border-gray-50 text-gray-600">{k.date}</td>
                        <td className="p-4 border-b border-gray-50 font-bold text-matcha-700">{k.amount}</td>
                        <td className="p-4 border-b border-gray-50">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                            k.status === 'Cair' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {k.status === 'Cair' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {k.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


      
        
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-matcha-950">Jadwal Umroh</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-xl hover:bg-matcha-50">
                      <div>
                        <h4 className="font-bold text-matcha-950">Umroh Reguler (9 Hari)</h4>
                        <p className="text-sm text-gray-500 mt-1">15 Oktober 2026</p>
                      </div>
                      <div className="mt-2 sm:mt-0 text-right">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium mb-1">Status: Tersedia</span>
                        <p className="text-sm font-medium text-gray-700">Sisa Kuota: 15 Seat</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-matcha-950">Jadwal Haji</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[1].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-xl hover:bg-matcha-50">
                      <div>
                        <h4 className="font-bold text-matcha-950">Haji Furoda</h4>
                        <p className="text-sm text-gray-500 mt-1">Musim Haji 2027</p>
                      </div>
                      <div className="mt-2 sm:mt-0 text-right">
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium mb-1">Status: Menipis</span>
                        <p className="text-sm font-medium text-gray-700">Sisa Kuota: 3 Seat</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Brosur Umroh 2026', type: 'PDF', icon: <FileText className="w-8 h-8 text-blue-500" /> },
                { title: 'Banner Sosial Media', type: 'PNG/JPG', icon: <Image className="w-8 h-8 text-green-500" /> },
                { title: 'Video Promosi', type: 'MP4', icon: <Video className="w-8 h-8 text-red-500" /> },
                { title: 'Logo PT Golden Tour Haromain', type: 'PNG', icon: <Image className="w-8 h-8 text-purple-500" /> },
                { title: 'Price List Terbaru', type: 'PDF', icon: <FileText className="w-8 h-8 text-gold-500" /> },
              ].map((item, idx) => (
                <div key={idx} className="bg-matcha-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all">
                  <div className="w-16 h-16 bg-matcha-50 rounded-full flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-matcha-950 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 mb-4">Format: {item.type}</p>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-matcha-50 transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifikasi' && (
          <div className="space-y-6">
            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {[
                  { title: 'Promo Baru: Diskon Early Bird Umroh Ramadhan', date: '2 jam yang lalu', type: 'Promo', unread: true },
                  { title: 'Informasi Visa: Perubahan Aturan Biometrik', date: '1 hari yang lalu', type: 'Informasi', unread: true },
                  { title: 'Jadwal Baru: Keberangkatan Tambahan November', date: '3 hari yang lalu', type: 'Jadwal', unread: false },
                  { title: 'Pengumuman: Maintenance Sistem CRM', date: '1 minggu yang lalu', type: 'Sistem', unread: false },
                ].map((notif, idx) => (
                  <div key={idx} className={`p-6 flex gap-4 hover:bg-matcha-50 transition-colors ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                    <div className="shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${notif.unread ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gold-600 bg-gold-50 px-2 py-0.5 rounded">{notif.type}</span>
                        <span className="text-xs text-gray-500">{notif.date}</span>
                      </div>
                      <h4 className={`font-medium ${notif.unread ? 'text-matcha-950' : 'text-gray-700'}`}>{notif.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">Klik untuk membaca detail selengkapnya mengenai {notif.title.toLowerCase()}.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profil' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="relative">
                  <div className="w-24 h-24 bg-matcha-100 rounded-full flex items-center justify-center overflow-hidden">
                    <User className="w-12 h-12 text-matcha-400" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-matcha-950 border-2 border-white hover:bg-gold-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-matcha-950">Agen Perwakilan A</h3>
                  <p className="text-gray-500 mb-2">ID Mitra: MTR-2026-001</p>
                  <span className="inline-block px-3 py-1 bg-gold-50 text-gold-700 text-xs rounded-full font-medium">Mitra Premium</span>
                </div>
              </div>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                    <input type="text" className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2.5 px-4 focus:ring-matcha-500 focus:border-matcha-500 outline-none" defaultValue="Agen Perwakilan A" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2.5 px-4 focus:ring-matcha-500 focus:border-matcha-500 outline-none" defaultValue="agen.a@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">No. WhatsApp</label>
                    <input type="text" className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2.5 px-4 focus:ring-matcha-500 focus:border-matcha-500 outline-none" defaultValue="081234567890" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input type="password" className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2.5 px-4 focus:ring-matcha-500 focus:border-matcha-500 outline-none" defaultValue="********" />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="font-bold text-matcha-950 mb-4">Data Rekening (Untuk Pencairan Komisi)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                      <select className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2.5 px-4 focus:ring-matcha-500 focus:border-matcha-500 outline-none">
                        <option>BSI (Bank Syariah Indonesia)</option>
                        <option>BCA</option>
                        <option>Mandiri</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">No. Rekening</label>
                      <input type="text" className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2.5 px-4 focus:ring-matcha-500 focus:border-matcha-500 outline-none" defaultValue="7123456789" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Atas Nama</label>
                      <input type="text" className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2.5 px-4 focus:ring-matcha-500 focus:border-matcha-500 outline-none" defaultValue="Agen Perwakilan A" />
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 flex justify-end">
                  <button type="button" className="px-6 py-2.5 bg-matcha-900 text-matcha-950 font-medium rounded-lg hover:bg-matcha-800 transition-colors shadow-sm shadow-matcha-900/20">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modals */}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 p-6 md:p-8 w-full max-w-lg shadow-xl">
              <h3 className="text-xl font-bold text-matcha-950 mb-4">Tambah Jamaah Baru</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jamaah</label>
                  <input type="text" className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2 px-3" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Paket</label>
                  <select className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2 px-3">
                    <option>Umroh Reguler (9 Hari)</option>
                    <option>Umroh Plus Turki (12 Hari)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran</label>
                  <select className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2 px-3">
                    <option>Belum Bayar</option>
                    <option>DP</option>
                    <option>Lunas</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-matcha-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-matcha-900 text-matcha-950 rounded-lg hover:bg-matcha-800">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingId !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 p-6 md:p-8 w-full max-w-lg shadow-xl">
              <h3 className="text-xl font-bold text-matcha-950 mb-4">Edit Data Jamaah</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setEditingId(null); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran</label>
                  <select className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2 px-3" defaultValue={jamaahList.find(j => j.id === editingId)?.statusPembayaran}>
                    <option>Belum Bayar</option>
                    <option>DP</option>
                    <option>Proses Dokumen</option>
                    <option>Lunas</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Paspor</label>
                    <select className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2 px-3" defaultValue={jamaahList.find(j => j.id === editingId)?.statusPaspor}>
                      <option>Belum</option>
                      <option>Proses</option>
                      <option>Selesai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Visa</label>
                    <select className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2 px-3" defaultValue={jamaahList.find(j => j.id === editingId)?.statusVisa}>
                      <option>Belum</option>
                      <option>Proses</option>
                      <option>Approved</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Keberangkatan</label>
                  <select className="w-full border-gray-300 rounded-lg bg-matcha-50 border py-2 px-3" defaultValue={jamaahList.find(j => j.id === editingId)?.statusBerangkat}>
                    <option>Belum</option>
                    <option>Menunggu</option>
                    <option>Berangkat</option>
                    <option>Selesai</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-600 hover:bg-matcha-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-matcha-900 text-matcha-950 rounded-lg hover:bg-matcha-800">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showUpload !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 p-6 md:p-8 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-matcha-950 mb-4">Upload Dokumen Jamaah</h3>
              <p className="text-sm text-gray-500 mb-4">Upload scan KTP, KK, Paspor, atau dokumen lainnya untuk jamaah ini.</p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-matcha-50 transition-colors cursor-pointer">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Klik atau drag file ke sini</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
              </div>
              <div className="pt-6 flex justify-end space-x-3">
                <button onClick={() => setShowUpload(null)} className="px-4 py-2 text-gray-600 hover:bg-matcha-100 rounded-lg">Batal</button>
                <button onClick={() => setShowUpload(null)} className="px-4 py-2 bg-matcha-900 text-matcha-950 rounded-lg hover:bg-matcha-800">Upload</button>
              </div>
            </div>
          </div>
        )}
      
        {activeTab === 'paket' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg: Package) => (
                <div key={pkg.id} className="bg-matcha-50 rounded-2xl shadow-xl border border-matcha-100 border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  <div className="h-48 overflow-hidden relative">
                    <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-matcha-50/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-matcha-950 shadow-sm">
                      Sisa Kuota: {Math.floor(Math.random() * 20) + 5} Pax
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-matcha-950 font-serif">{pkg.name}</h3>
                    </div>
                    <div className="text-matcha-950 text-sm mb-4 leading-snug space-y-1.5 font-bold">
                      {Array.isArray(pkg.description) ? (
                        pkg.description.map((line: string, i: number) => (
                          <p key={i} className="flex items-start">
                            <span className="w-1 h-1 rounded-full bg-gold-500 mt-1.5 mr-2 shrink-0" />
                            {line}
                          </p>
                        ))
                      ) : (
                        <p className="flex items-start">
                          <span className="w-1 h-1 rounded-full bg-gold-500 mt-1.5 mr-2 shrink-0" />
                          {pkg.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-auto space-y-4">
                      <div className="flex justify-between items-center bg-matcha-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-sm text-gray-500">Harga</span>
                        <span className="text-lg font-bold text-matcha-700">Rp {Number(pkg.price).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gold-50 p-3 rounded-lg border border-gold-100">
                        <span className="text-sm text-gold-700">Komisi Mitra</span>
                        <span className="text-sm font-bold text-gold-700">Rp {(Number(pkg.price) * 0.05).toLocaleString('id-ID')}</span>
                      </div>
                      
                      <Link to={`/paket/${pkg.id}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center px-4 py-2 border border-matcha-200 text-matcha-700 rounded-lg hover:bg-matcha-50 transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat Detail Halaman
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
