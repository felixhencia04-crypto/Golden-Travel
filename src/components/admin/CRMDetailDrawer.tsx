import React, { useState } from 'react';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from '@/components/ui/sheet';
import { Tabs as ShadcnTabs, TabsContent as ShadcnTabsContent, TabsList as ShadcnTabsList, TabsTrigger as ShadcnTabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CRMRegistration, Activity, RegistrationStatus } from '@/src/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { toast } from 'sonner';
import { 
  User, FileText, CreditCard, History, CheckCircle2, XCircle, 
  Clock, AlertCircle, Save, Download, Loader2 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CRMDetailDrawerProps {
  registration: CRMRegistration | null;
  onClose: () => void;
}

const REGISTRATION_STATUSES: { value: RegistrationStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PILIH_PAKET', label: 'Pilih Paket' },
  { value: 'ISI_BIODATA', label: 'Isi Biodata' },
  { value: 'UPLOAD_DOKUMEN', label: 'Upload Dokumen' },
  { value: 'VERIFIKASI_DOKUMEN', label: 'Verifikasi Dokumen' },
  { value: 'CICIL_BAYAR', label: 'Cicil Bayar' },
  { value: 'VERIFIKASI_BAYAR', label: 'Verifikasi Bayar' },
  { value: 'LUNAS', label: 'Lunas' },
  { value: 'SIAP_BERANGKAT', label: 'Siap Berangkat' },
  { value: 'BERANGKAT', label: 'Berangkat' },
  { value: 'SELESAI', label: 'Selesai' },
];

export const CRMDetailDrawer: React.FC<CRMDetailDrawerProps> = ({ registration, onClose }) => {
  const queryClient = useQueryClient();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<RegistrationStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState('');

  // Fetch Activity History
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['activities', registration?.id],
    queryFn: () => api.get(`/registrasi/${registration?.id}/activity`),
    enabled: !!registration?.id,
  });

  // Fetch Payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery<any[]>({
    queryKey: ['payments', registration?.id],
    queryFn: () => api.get(`/registrasi/${registration?.id}/transaksis`),
    enabled: !!registration?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; notes: string }) => 
      api.put(`/registrasi/${registration?.id}/status`, data),
    onSuccess: () => {
      toast.success("Status berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ['crm_registrations'] });
      queryClient.invalidateQueries({ queryKey: ['activities', registration?.id] });
      setIsUpdatingStatus(false);
      setNewStatus('');
      setStatusNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal memperbarui status");
    }
  });

  if (!registration) return null;

  return (
    <Sheet open={!!registration} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-white border-l shadow-2xl">
        <SheetHeader className="p-6 border-b bg-gray-50/50">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-2xl font-black text-gray-900 tracking-tight">
                Detail Jamaah
              </SheetTitle>
              <SheetDescription className="mt-1 font-medium text-gray-500">
                Informasi lengkap pendaftaran #{registration.id.substring(0, 8)}
              </SheetDescription>
            </div>
            <Badge className="px-3 py-1 rounded-full bg-gold-100 text-gold-700 border-gold-200 font-bold">
              {registration.status}
            </Badge>
          </div>
        </SheetHeader>

        <ShadcnTabs defaultValue="biodata" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-white">
            <ShadcnTabsList className="bg-transparent gap-6 h-14 w-full justify-start p-0">
              <ShadcnTabsTrigger 
                value="biodata" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-gold-600 data-[state=active]:border-b-2 data-[state=active]:border-gold-500 rounded-none px-0 h-full font-bold text-gray-400 transition-all flex gap-2 items-center"
              >
                <User className="w-4 h-4" />
                Biodata
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger 
                value="dokumen" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-gold-600 data-[state=active]:border-b-2 data-[state=active]:border-gold-500 rounded-none px-0 h-full font-bold text-gray-400 transition-all flex gap-2 items-center"
              >
                <FileText className="w-4 h-4" />
                Dokumen
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger 
                value="pembayaran" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-gold-600 data-[state=active]:border-b-2 data-[state=active]:border-gold-500 rounded-none px-0 h-full font-bold text-gray-400 transition-all flex gap-2 items-center"
              >
                <CreditCard className="w-4 h-4" />
                Pembayaran
              </ShadcnTabsTrigger>
              <ShadcnTabsTrigger 
                value="aktivitas" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-gold-600 data-[state=active]:border-b-2 data-[state=active]:border-gold-500 rounded-none px-0 h-full font-bold text-gray-400 transition-all flex gap-2 items-center"
              >
                <History className="w-4 h-4" />
                Aktivitas
              </ShadcnTabsTrigger>
            </ShadcnTabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              <ShadcnTabsContent value="biodata" className="mt-0 space-y-8">
                <section>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                    Informasi Utama
                  </h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Nama Lengkap</label>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{registration.user?.name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Nomor HP</label>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{registration.user?.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Email</label>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{registration.user?.email}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Tanggal Daftar</label>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{new Date(registration.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                    Paket Perjalanan
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-black text-gray-900">{registration.package?.name}</span>
                      <Badge className="bg-white border-gray-200 text-gray-600 font-bold">{registration.package?.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Jadwal: {registration.schedule?.departureDate ? new Date(registration.schedule.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Segera Ditentukan'}</p>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                    Kontrol Admin
                  </h4>
                  <div className="p-6 border-2 border-dashed border-gray-200 rounded-3xl space-y-4">
                    <p className="text-xs font-bold text-gray-500 italic">Gunakan kontrol di bawah ini untuk mengubah status jamaah secara manual jika diperlukan.</p>
                    {!isUpdatingStatus ? (
                      <Button 
                        onClick={() => setIsUpdatingStatus(true)}
                        className="w-full bg-[#132019] hover:bg-black text-white font-bold h-12 rounded-2xl flex gap-2 items-center"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Ubah Status Manual
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <Select 
                          value={newStatus} 
                          onValueChange={(val) => setNewStatus(val as RegistrationStatus)}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold">
                            <SelectValue placeholder="Pilih status baru..." />
                          </SelectTrigger>
                          <SelectContent>
                            {REGISTRATION_STATUSES.map(s => (
                              <SelectItem key={s.value} value={s.value} className="font-bold">{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Textarea 
                          placeholder="Alasan perubahan status..."
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          className="rounded-xl border-gray-200 min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsUpdatingStatus(false)}
                            className="flex-1 rounded-xl h-12 font-bold"
                          >
                            Batal
                          </Button>
                          <Button 
                            disabled={!newStatus || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ status: newStatus, notes: statusNotes })}
                            className="flex-1 bg-gold-500 hover:bg-gold-600 text-black font-bold h-12 rounded-xl"
                          >
                            {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Simpan Perubahan
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </ShadcnTabsContent>

              <ShadcnTabsContent value="dokumen" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {['KTP', 'Paspor', 'Buku Nikah', 'Foto', 'Vaksin'].map(type => (
                    <div key={type} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{type}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Wajib Diunggah</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-200">Belum Ada</Badge>
                    </div>
                  ))}
                </div>
              </ShadcnTabsContent>

              <ShadcnTabsContent value="pembayaran" className="mt-0 space-y-6">
                {isLoadingPayments ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold-500 mb-2" />
                    <p className="text-sm font-bold text-gray-400">Memuat riwayat bayar...</p>
                  </div>
                ) : !payments?.length ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-500">Belum ada riwayat pembayaran</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((p: any) => (
                      <div key={p.id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center bg-white shadow-sm">
                        <div className="flex gap-3">
                           <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                             <CreditCard className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="text-sm font-black text-gray-900">Rp {Number(p.amount).toLocaleString('id-ID')}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{p.paymentType} • {new Date(p.createdAt).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <Badge className={p.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ShadcnTabsContent>

              <ShadcnTabsContent value="aktivitas" className="mt-0">
                {isLoadingActivities ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold-500 mb-2" />
                    <p className="text-sm font-bold text-gray-400">Memuat riwayat...</p>
                  </div>
                ) : !activities?.length ? (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-500">Belum ada riwayat aktivitas</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    {activities.map((a) => (
                      <div key={a.id} className="relative">
                        <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-gold-500 ring-4 ring-white"></div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                          {new Date(a.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <p className="text-sm font-black text-gray-900">{a.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">{a.details}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 italic flex items-center gap-1">
                           Oleh: <span className="text-gray-900 not-italic">{a.user?.name || 'Sistem'}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ShadcnTabsContent>
            </ScrollArea>
          </div>
        </ShadcnTabs>
      </SheetContent>
    </Sheet>
  );
};
