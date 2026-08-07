import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api';
import { CRMRegistration, Package, Schedule } from '@/src/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  MoreHorizontal, Eye, CheckCircle2, XCircle, Clock, Loader2, Trash2, UserCheck
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CRMDetailDrawer } from './CRMDetailDrawer';
import { toast } from 'sonner';

export const CRMTable: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<CRMRegistration | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      toast.success("Jamaah dan akun login berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ['crm_registrations'] });
      if (onRefresh) onRefresh();
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menghapus jamaah");
      setDeleteId(null);
    }
  });

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Data
  const { data: crmData, isLoading } = useQuery({
    queryKey: ['crm_registrations', page, limit, debouncedSearch, statusFilter, packageFilter, scheduleFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
      });
      if (statusFilter.length > 0) {
        statusFilter.forEach(s => params.append('status', s));
      }
      if (packageFilter !== 'all') params.append('packageId', packageFilter);
      if (scheduleFilter !== 'all') params.append('scheduleId', scheduleFilter);
      
      return api.get(`/admin/registrasis?${params.toString()}`);
    },
  });

  // Fetch Packages & Schedules for filters
  const { data: packages } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: () => api.get('/pakets'),
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ['schedules', packageFilter],
    queryFn: () => api.get(`/schedules?packageId=${packageFilter !== 'all' ? packageFilter : ''}`),
  });

  const handleExport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/registrasis/export?format=xlsx`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jamaah_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Data berhasil diekspor");
    } catch (err) {
      toast.error("Gagal mengekspor data");
    }
  };

  const columns = useMemo<ColumnDef<CRMRegistration>[]>(() => [
    {
      accessorKey: 'user.name',
      header: () => <div className="text-center">Nama Jamaah</div>,
      cell: ({ row }) => {
        const reg = row.original as any;
        const name = reg.name || reg.ordererName || reg.paxData?.[0]?.fullName || reg.paxData?.[0]?.name || reg.user?.name;
        const email = reg.email || reg.ordererEmail || reg.paxData?.[0]?.email || reg.user?.email;
        return (
          <div className="flex flex-col items-center text-center">
            <span className="font-black text-gray-900">{name}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'user.phone',
      header: () => <div className="text-center">No. HP</div>,
      cell: ({ row }) => {
        const reg = row.original as any;
        const phone = reg.phone || reg.ordererPhone || reg.paxData?.[0]?.phone || reg.user?.phone || '-';
        return <div className="text-center font-bold text-gray-600">{phone}</div>;
      },
    },
    {
      accessorKey: 'package.name',
      header: () => <div className="text-center">Paket</div>,
      cell: ({ row }) => (
        <div className="flex flex-col items-center text-center max-w-[150px] mx-auto">
          <span className="font-bold text-gray-800 truncate">{row.original.package?.name || "Belum Pilih Paket"}</span>
          <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 bg-gray-50 border-gray-200 text-gray-500 font-black uppercase">
            {row.original.package?.type || "-"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'schedule.departureDate',
      header: () => <div className="text-center">Jadwal</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-sm font-bold text-gray-600">
            {row.original.schedule?.departureDate 
              ? new Date(row.original.schedule.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
              : 'TBA'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        const colorMap: Record<string, string> = {
          'DRAFT': 'bg-gray-100 text-gray-600',
          'UPLOAD_DOKUMEN': 'bg-orange-100 text-orange-700',
          'LUNAS': 'bg-green-100 text-green-700',
          'CICIL_BAYAR': 'bg-blue-100 text-blue-700',
          'VERIFIKASI_BAYAR': 'bg-yellow-100 text-yellow-700',
          'VERIFIKASI_DOKUMEN': 'bg-yellow-100 text-yellow-700',
          'SIAP_BERANGKAT': 'bg-indigo-100 text-indigo-700',
        };
        return (
          <div className="text-center">
            <Badge className={`rounded-full px-3 py-0.5 font-black text-[10px] border-none shadow-none uppercase tracking-widest ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
              {status.replace(/_/g, ' ')}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'docs',
      header: () => <div className="text-center">Dokumen</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.hasRequiredDocs ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Clock className="w-5 h-5 text-gray-300" />
          )}
        </div>
      ),
    },
    {
      id: 'payment',
      header: () => <div className="text-center">Pembayaran</div>,
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 w-24 mx-auto">
          <div className="flex justify-between text-[10px] font-black text-gray-400">
            <span>Progress</span>
            <span className={row.original.paymentProgress === 100 ? 'text-green-600' : ''}>{row.original.paymentProgress}%</span>
          </div>
          <Progress value={row.original.paymentProgress} className="h-1.5" />
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex justify-center"
          onClick={(e) => e.stopPropagation()} 
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl border-gray-100">
            <DropdownMenuItem 
              onClick={() => setSelectedReg(row.original)}
              className="flex gap-2 items-center font-bold text-sm h-10 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                setDeleteId(row.original.user.id);
              }}
              className="flex gap-2 items-center font-bold text-sm h-10 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: crmData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 p-6 lg:p-10 max-w-[1600px] mx-auto bg-[#F8F9FA] min-h-screen">
      {/* Header Box */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-[#12291C] via-[#1c3e2b] to-[#12291C] text-white p-6 rounded-3xl shadow-xl border border-matcha-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 pointer-events-none rounded-r-3xl blur-xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3.5 bg-matcha-800/80 backdrop-blur-md rounded-2xl border border-matcha-600/40 text-gold-400 shadow-md">
            <UserCheck className="w-7 h-7 text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">CRM Jamaah</h1>
            <p className="text-xs sm:text-sm text-matcha-200/90 font-medium mt-0.5">Kelola seluruh data jemaat terdata di satu tempat.</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Cari nama atau No. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all font-medium"
            />
          </div>

          <Select value={packageFilter} onValueChange={setPackageFilter}>
            <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 font-bold">
              <SelectValue placeholder="Semua Paket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Paket</SelectItem>
              {packages?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
            <SelectTrigger className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 font-bold">
              <SelectValue placeholder="Semua Jadwal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jadwal</SelectItem>
              {schedules?.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {new Date(s.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 rounded-2xl border-gray-200 bg-gray-50/50 font-bold flex justify-between px-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Status ({statusFilter.length || 'Semua'})
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-2 rounded-2xl shadow-2xl border-gray-100">
              {[
                'DRAFT', 'ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 
                'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'
              ].map(status => (
                <DropdownMenuItem 
                  key={status}
                  onSelect={(e) => {
                    e.preventDefault();
                    setStatusFilter(prev => 
                      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                    );
                  }}
                  className="flex items-center justify-between font-bold h-10 rounded-lg cursor-pointer"
                >
                  {status.replace(/_/g, ' ')}
                  {statusFilter.includes(status) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </DropdownMenuItem>
              ))}
              {statusFilter.length > 0 && (
                <DropdownMenuItem 
                  onSelect={() => setStatusFilter([])}
                  className="mt-2 text-center text-xs text-red-500 hover:text-red-600 font-black h-8 rounded-lg cursor-pointer flex justify-center bg-red-50"
                >
                  RESET FILTER
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-gray-100">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-14 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={columns.length} className="h-20 bg-gray-50/30 border-b border-gray-50" />
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => setSelectedReg(row.original)}
                    className="group cursor-pointer hover:bg-gold-50/30 transition-colors border-b-gray-50 h-20"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Search className="w-12 h-12 opacity-20" />
                      <p className="font-bold">Tidak ada data jamaah ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/20">
          <p className="text-sm font-bold text-gray-400">
            Menampilkan <span className="text-gray-900">{((page - 1) * limit) + 1}</span> - <span className="text-gray-900">{Math.min(page * limit, crmData?.pagination.total || 0)}</span> dari <span className="text-gray-900">{crmData?.pagination.total || 0}</span> jamaah
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl font-bold h-10 px-4 border-gray-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: crmData?.pagination.pages || 0 }).map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold ${page === i + 1 ? 'bg-gold-500 text-black hover:bg-gold-600' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (crmData?.pagination.pages || 1)}
              className="rounded-xl font-bold h-10 px-4 border-gray-200"
            >
              Lanjut
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <CRMDetailDrawer 
        registration={selectedReg} 
        onClose={() => setSelectedReg(null)} 
      />

       {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-center mb-2">Hapus Data Jamaah?</h2>
            <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed">
              Tindakan ini akan menghapus permanen data jamaah, <strong>akun login</strong>, serta seluruh dokumen, pembayaran, dan riwayat yang terkait. Jamaah tidak akan bisa login kembali dan wajib mendaftar akun baru jika ingin masuk.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteId(null)}
                className="flex-1 h-12 rounded-2xl font-bold border-gray-200 hover:bg-gray-50 text-gray-700"
                disabled={deleteMutation.isPending}
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteId)}
                className="flex-1 h-12 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Ya, Hapus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
