import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
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
  MoreHorizontal, Eye, CheckCircle2, XCircle, Clock, Loader2 
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CRMDetailDrawer } from './CRMDetailDrawer';
import { toast } from 'sonner';

export const CRMTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<CRMRegistration | null>(null);

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
      header: 'Nama Jamaah',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-gray-900">{row.original.user.name}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{row.original.user.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'user.phone',
      header: 'No. HP',
      cell: ({ row }) => <span className="font-bold text-gray-600">{row.original.user.phone || '-'}</span>,
    },
    {
      accessorKey: 'package.name',
      header: 'Paket',
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[150px]">
          <span className="font-bold text-gray-800 truncate">{row.original.package.name}</span>
          <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 bg-gray-50 border-gray-200 text-gray-500 font-black uppercase">
            {row.original.package.type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'schedule.departureDate',
      header: 'Jadwal',
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600">
          {row.original.schedule?.departureDate 
            ? new Date(row.original.schedule.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
            : 'TBA'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colorMap: Record<string, string> = {
          'DRAFT': 'bg-gray-100 text-gray-600',
          'LUNAS': 'bg-green-100 text-green-700',
          'CICIL_BAYAR': 'bg-blue-100 text-blue-700',
          'VERIFIKASI_BAYAR': 'bg-yellow-100 text-yellow-700',
          'VERIFIKASI_DOKUMEN': 'bg-yellow-100 text-yellow-700',
          'SIAP_BERANGKAT': 'bg-indigo-100 text-indigo-700',
        };
        return (
          <Badge className={`rounded-full px-3 py-0.5 font-black text-[10px] border-none shadow-none uppercase tracking-widest ${colorMap[status] || 'bg-gray-100'}`}>
            {status.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'docs',
      header: 'Dokumen',
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
      header: 'Pembayaran',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 w-24">
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
      header: 'Aksi',
      cell: ({ row }) => (
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
            <DropdownMenuItem className="flex gap-2 items-center font-bold text-sm h-10 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50">
              <XCircle className="w-4 h-4" />
              Batalkan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">CRM Jamaah</h1>
          <p className="text-gray-500 font-medium">Kelola seluruh data jamaah dan pendaftaran dalam satu tempat.</p>
        </div>
        <Button 
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-green-100 flex gap-2 items-center transition-all"
        >
          <Download className="w-5 h-5" />
          Ekspor ke Excel
        </Button>
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
    </div>
  );
};
