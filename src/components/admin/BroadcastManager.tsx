import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Users, 
  UserCheck, 
  Search, 
  CheckSquare, 
  Square, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Info, 
  Send,
  Eye,
  Check,
  RefreshCw,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface BroadcastManagerProps {
  users: any[];
  consultations: any[];
  announcements: any[];
  deleteAnnouncement: (id: string) => void;
  refreshData: (silent?: boolean) => Promise<void>;
}

export default function BroadcastManager({
  users = [],
  consultations = [],
  announcements = [],
  deleteAnnouncement,
  refreshData,
}: BroadcastManagerProps) {
  const [broadcastMessage, setBroadcastMessage] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'important' | 'update',
  });

  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'jamaah' | 'mitra' | 'registered'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Combine user accounts with consultation info if available
  const mappedUsers = useMemo(() => {
    return (users || []).map((u) => {
      const userReg = consultations?.find(
        (c) => c.userId === u.id || (c.email && c.email.toLowerCase() === (u.email || '').toLowerCase())
      );
      return {
        ...u,
        hasRegistration: !!userReg,
        packageName: userReg?.packageName || null,
        registrationStatus: userReg?.status || null,
      };
    });
  }, [users, consultations]);

  // Filtered users for target selection list
  const filteredUsers = useMemo(() => {
    return mappedUsers.filter((u) => {
      const query = userSearchQuery.toLowerCase().trim();
      const nameMatch = (u.name || u.displayName || '').toLowerCase().includes(query);
      const emailMatch = (u.email || '').toLowerCase().includes(query);
      const phoneMatch = (u.phone || '').toLowerCase().includes(query);
      const packageMatch = (u.packageName || '').toLowerCase().includes(query);

      const matchesSearch = !query || nameMatch || emailMatch || phoneMatch || packageMatch;

      if (!matchesSearch) return false;

      if (roleFilter === 'jamaah') return u.role === 'jamaah' || !u.role;
      if (roleFilter === 'mitra') return u.role === 'mitra';
      if (roleFilter === 'registered') return u.hasRegistration;

      return true;
    });
  }, [mappedUsers, userSearchQuery, roleFilter]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToSelect = filteredUsers.map((u) => u.id).filter(Boolean);
    const combined = Array.from(new Set([...selectedUserIds, ...idsToSelect]));
    setSelectedUserIds(combined);
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleSelectPaidJamaah = () => {
    const paidUserIds = mappedUsers
      .filter((u) => u.registrationStatus === 'payment' || u.hasRegistration)
      .map((u) => u.id)
      .filter(Boolean);
    setSelectedUserIds(Array.from(new Set(paidUserIds)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!broadcastMessage.title.trim() || !broadcastMessage.content.trim()) {
      toast.error('Judul dan konten pengumuman wajib diisi');
      return;
    }

    if (targetType === 'SPECIFIC' && selectedUserIds.length === 0) {
      toast.error('Pilih minimal 1 akun penerima pengumuman');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/broadcast', {
        title: broadcastMessage.title.trim(),
        content: broadcastMessage.content.trim(),
        type: broadcastMessage.type,
        targetType,
        targetUserIds: targetType === 'SPECIFIC' ? selectedUserIds : [],
      });

      toast.success(
        targetType === 'SPECIFIC'
          ? `Pengumuman berhasil dikirim khusus ke ${selectedUserIds.length} akun terpilih!`
          : 'Pengumuman berhasil dikirim ke seluruh jamaah!'
      );

      setBroadcastMessage({ title: '', content: '', type: 'info' });
      setSelectedUserIds([]);
      await refreshData(true);
    } catch (err: any) {
      toast.error('Gagal mengirim pengumuman: ' + (err.response?.data?.error || err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Kirim Broadcast */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-3 text-gray-900">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Kirim Pengumuman Baru</h3>
                <p className="text-xs text-gray-500">Buat dan sebarkan pengumuman ke jamaah/akun terdaftar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                showPreview
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              <span>{showPreview ? 'Sembunyikan Preview' : 'Pratinjau Pesan'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Selection Switch */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Target Penerima Pengumuman
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-2xl border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setTargetType('ALL')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                    targetType === 'ALL'
                      ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Semua Jamaah (Broadcast All)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('SPECIFIC')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                    targetType === 'SPECIFIC'
                      ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Akun / Jamaah Spesifik</span>
                </button>
              </div>
            </div>

            {/* Target Specific Accounts Panel */}
            {targetType === 'SPECIFIC' && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-3.5 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center">
                    <UserCheck className="w-4 h-4 mr-1.5 text-emerald-700" />
                    Pilih Akun Penerima ({selectedUserIds.length} Terpilih)
                  </span>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      Pilih Semua Hasil ({filteredUsers.length})
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleSelectPaidJamaah}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      Pilih Jamaah Terdaftar
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-rose-600 hover:underline font-bold"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, email, no. hp, atau paket..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-gray-200 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e: any) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-white rounded-xl border border-gray-200 outline-none focus:border-emerald-600 font-semibold text-gray-700"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="jamaah">Jamaah Umum</option>
                    <option value="registered">Sudah Daftar Paket</option>
                    <option value="mitra">Mitra / Agen</option>
                  </select>
                </div>

                {/* Scrollable User Checklist */}
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 p-2 space-y-1">
                  {filteredUsers.map((u) => {
                    const isChecked = selectedUserIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/80 border border-emerald-300'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleUser(u.id)}
                            className="w-4 h-4 text-emerald-700 rounded border-gray-300 focus:ring-emerald-600 cursor-pointer"
                          />
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                            {(u.name || u.displayName || u.email || 'J').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {u.name || u.displayName || 'Jamaah Tanpa Nama'}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {u.email || '-'} • {u.phone || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {u.packageName && (
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold truncate max-w-[110px]">
                              {u.packageName}
                            </span>
                          )}
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                              u.role === 'mitra'
                                ? 'bg-purple-50 text-purple-700'
                                : u.role === 'admin'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {u.role || 'Jamaah'}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-400">
                      Tidak ada akun yang sesuai pencarian
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inputs Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastMessage.title}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                  placeholder="Misal: Info Jadwal Manasik & Pembagian Paspor"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tipe Pesan
                </label>
                <select
                  value={broadcastMessage.type}
                  onChange={(e: any) => setBroadcastMessage({ ...broadcastMessage, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                >
                  <option value="info">Informasi Umum</option>
                  <option value="important">Penting / Urgent</option>
                  <option value="update">Pembaruan Jadwal</option>
                </select>
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Konten Pesan Pengumuman *
              </label>
              <textarea
                required
                rows={5}
                value={broadcastMessage.content}
                onChange={(e) => setBroadcastMessage({ ...broadcastMessage, content: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                placeholder="Tuliskan isi detail pengumuman resmi di sini..."
              />
            </div>

            {/* Live Preview Box */}
            {showPreview && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-gray-200 space-y-2 animate-fadeIn">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-emerald-700" /> Tampilan di Portal Jamaah
                </p>
                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm relative overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      broadcastMessage.type === 'important'
                        ? 'bg-rose-500'
                        : broadcastMessage.type === 'update'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  ></div>
                  <div className="pl-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          broadcastMessage.type === 'important'
                            ? 'bg-rose-100 text-rose-800'
                            : broadcastMessage.type === 'update'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {broadcastMessage.type === 'important'
                          ? 'Penting & Urgent'
                          : broadcastMessage.type === 'update'
                          ? 'Pembaruan Jadwal'
                          : 'Informasi Umum'}
                      </span>
                      <span className="text-[10px] text-gray-400">Baru saja</span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">
                      {broadcastMessage.title || 'Judul Pengumuman'}
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      {broadcastMessage.content || 'Isi pesan pengumuman akan tampil di sini...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  <span>Mengirim Pengumuman...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  <span>
                    {targetType === 'SPECIFIC'
                      ? `Kirim Khusus Ke ${selectedUserIds.length} Akun Terpilih`
                      : 'Sebarkan Pengumuman Ke Semua Jamaah'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Riwayat Broadcast */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-emerald-700" /> Riwayat Broadcast
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 rounded-full text-gray-600">
              {announcements.length} Pengumuman
            </span>
          </div>

          <div className="space-y-3.5 max-h-[750px] overflow-y-auto pr-1">
            {announcements.map((ann) => {
              const isTargeted = ann.userId !== null && ann.userId !== undefined;
              const targetUser = isTargeted ? users.find((u) => u.id === ann.userId) : null;

              return (
                <div
                  key={ann.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm relative group hover:border-emerald-300 transition-all"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                      ann.type === 'important'
                        ? 'bg-rose-500'
                        : ann.type === 'update'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  ></div>

                  <div className="pl-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            ann.type === 'important'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : ann.type === 'update'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          }`}
                        >
                          {ann.type === 'important' ? 'Penting' : ann.type === 'update' ? 'Pembaruan' : 'Informasi'}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center ${
                            isTargeted
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}
                        >
                          {isTargeted ? (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              {targetUser ? targetUser.name || targetUser.email : 'Akun Spesifik'}
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3 mr-1" />
                              Semua Jamaah
                            </>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all opacity-80 group-hover:opacity-100"
                        title="Hapus Broadcast"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm leading-snug">
                      {ann.title || 'Pengumuman Resmi'}
                    </h4>

                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-gray-100">
                      {ann.message || ann.content || 'Detail pengumuman'}
                    </p>

                    <p className="text-[10px] text-gray-400 font-medium flex items-center space-x-1 pt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>
                        {ann.createdAt
                          ? new Date(ann.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }) + ' WIB'
                          : 'Baru saja'}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}

            {announcements.length === 0 && (
              <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-bold text-gray-600">Belum ada broadcast yang dikirim</p>
                <p className="text-xs text-gray-400 mt-1">Gunakan formulir di samping untuk mengirim pesan pengumuman</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
