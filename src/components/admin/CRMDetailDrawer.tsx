import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Tabs as ShadcnTabs, TabsContent as ShadcnTabsContent, TabsList as ShadcnTabsList, TabsTrigger as ShadcnTabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CRMRegistration, Activity, RegistrationStatus } from '@/src/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { toast } from 'sonner';
import { 
  User, CheckCircle2, XCircle, 
  Clock, AlertCircle, Save, Download, Loader2 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateJamaahBiodataPdf } from '@/src/utils/generateJamaahBiodataPdf';

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
  const [activePaxIdx, setActivePaxIdx] = useState(0);

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
    <Dialog open={!!registration} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col bg-white overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 border-b bg-gray-50/50">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                Detail Jamaah
              </DialogTitle>
              <DialogDescription className="mt-1 font-medium text-gray-500">
                Informasi lengkap pendaftaran #{registration.id.substring(0, 8)}
              </DialogDescription>
            </div>
            <Badge className="px-3 py-1 rounded-full bg-gold-100 text-gold-700 border-gold-200 font-bold">
              {registration.status}
            </Badge>
          </div>
        </DialogHeader>

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
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{(registration as any).name || (registration as any).ordererName || registration.paxData?.[0]?.fullName || registration.paxData?.[0]?.name || registration.user?.name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Nomor HP</label>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{(registration as any).phone || (registration as any).ordererPhone || registration.paxData?.[0]?.phone || registration.user?.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Email</label>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{(registration as any).email || (registration as any).ordererEmail || registration.paxData?.[0]?.email || registration.user?.email}</p>
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
                      <span className="text-sm font-black text-gray-900">{registration.package?.name || "Belum Pilih Paket"}</span>
                      <Badge className="bg-white border-gray-200 text-gray-600 font-bold">{registration.package?.type || "-"}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Jadwal: {registration.schedule?.departureDate ? new Date(registration.schedule.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Segera Ditentukan'}</p>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                    Biodata Jamaah (Pax)
                  </h4>
                  {registration.paxData && registration.paxData.length > 0 ? (
                    <div className="space-y-4">
                      {registration.paxData.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {registration.paxData.map((pax, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActivePaxIdx(idx)}
                              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                activePaxIdx === idx 
                                  ? 'bg-gold-50 border-gold-200 text-gold-700' 
                                  : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              Jamaah {idx + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {(() => {
                        const idx = activePaxIdx;
                        const pax = registration.paxData[idx];
                        if (!pax) return null;
                        
                        return (
                          <div key={idx} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gold-500"></div>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h5 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  {pax.fullName || pax.name || 'Belum Diisi'}
                                </h5>
                                <p className="text-xs font-medium text-gray-500">Jamaah {idx + 1} • NIK: {pax.nik || '-'}</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 rounded-xl font-bold bg-white text-gray-900 border-gray-200 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => generateJamaahBiodataPdf(registration, idx)}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Cetak PDF
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tempat/Tgl Lahir</label>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">{pax.pob || '-'}/{pax.dob || '-'}</p>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Jenis Kelamin</label>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">{pax.gender || '-'}</p>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Telepon</label>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">{pax.phone || (idx === 0 ? registration.user?.phone : '-')}</p>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Email</label>
                                <p className="text-xs font-bold text-gray-900 mt-0.5" style={{ wordBreak: 'break-all' }}>{pax.email || (idx === 0 ? registration.user?.email : '-')}</p>
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Alamat Lengkap</label>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">{pax.address || '-'}</p>
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Status Pernikahan</label>
                                <p className="text-xs font-bold text-gray-900 mt-0.5">{pax.maritalStatus || '-'}{pax.spouseName ? ` (${pax.spouseName})` : ''}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Data Paspor</label>
                                <p className="text-xs font-bold text-gray-900 mb-1">{pax.passportNo || 'Belum Diisi'}</p>
                                {pax.passportNo && (
                                  <p className="text-[10px] text-gray-500 font-medium">Berlaku s/d: {pax.passportExpiryDate || '-'}</p>
                                )}
                              </div>
                              <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Kondisi Medis</label>
                                <p className="text-xs font-bold text-gray-900 mb-1">{pax.medicalHistory === 'Lainnya' ? (pax.medicalHistoryDetails || 'Lainnya') : (pax.medicalHistory || 'Sehat / Tidak ada')}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm font-bold text-gray-400">Belum ada data biodata jamaah yang diisi.</p>
                    </div>
                  )}
                </section>

                <section>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                    Kontrol Admin
                  </h4>
                  <div className="p-6 border-2 border-dashed border-gray-200 rounded-3xl space-y-4">
                    <p className="text-xs font-bold text-gray-500 italic">Gunakan kontrol di bawah ini untuk mengubah status jamaah secara manual jika diperlukan.</p>
                    {!isUpdatingStatus ? (
                      registration?.id.startsWith('no-reg-') ? (
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl font-bold text-sm flex items-center justify-center border border-orange-100 text-center">
                          Jemaah ini belum memilih paket.<br/>Status tidak dapat diubah secara manual.
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setIsUpdatingStatus(true)}
                          className="w-full bg-[#132019] hover:bg-black text-white font-bold h-12 rounded-2xl flex gap-2 items-center"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Ubah Status Manual
                        </Button>
                      )
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
            </ScrollArea>
          </div>
        </ShadcnTabs>
      </DialogContent>
    </Dialog>
  );
};
