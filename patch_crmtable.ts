import fs from 'fs';

let content = fs.readFileSync('src/components/admin/CRMTable.tsx', 'utf8');

const targetImports = `import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  MoreHorizontal, Eye, CheckCircle2, XCircle, Clock, Loader2
} from 'lucide-react';`;

const replacementImports = `import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  MoreHorizontal, Eye, CheckCircle2, XCircle, Clock, Loader2, Trash2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';`;

if (content.includes(targetImports)) {
  content = content.replace(targetImports, replacementImports);
} else {
  // If the import is missing useQueryClient, we might just need to add Trash2
  content = content.replace('XCircle, Clock, Loader2 }', 'XCircle, Clock, Loader2, Trash2 }');
  content = content.replace("import { useQuery } from '@tanstack/react-query';", "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';");
}

const targetState = `  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<CRMRegistration | null>(null);`;

const replacementState = `  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<CRMRegistration | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(\`/admin/users/\${userId}\`),
    onSuccess: () => {
      toast.success("Jamaah berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ['crm_registrations'] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menghapus jamaah");
      setDeleteId(null);
    }
  });`;

if (content.includes(targetState)) {
  content = content.replace(targetState, replacementState);
}

const targetActions = `            <DropdownMenuItem 
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
        </DropdownMenu>`;

const replacementActions = `            <DropdownMenuItem 
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
        </DropdownMenu>`;

if (content.includes(targetActions)) {
  content = content.replace(targetActions, replacementActions);
}

const targetModal = `      <CRMDetailDrawer 
         registration={selectedReg}
         onClose={() => setSelectedReg(null)} 
       />
    </div>`;

const replacementModal = `      <CRMDetailDrawer 
         registration={selectedReg}
         onClose={() => setSelectedReg(null)} 
       />
       
       {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-center mb-2">Hapus Jamaah?</h2>
            <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed">
              Tindakan ini akan menghapus permanen data jamaah beserta seluruh dokumen, pembayaran, dan riwayat yang terkait. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteId(null)}
                className="flex-1 h-12 rounded-2xl font-bold"
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
    </div>`;

if (content.includes(targetModal)) {
  content = content.replace(targetModal, replacementModal);
}

fs.writeFileSync('src/components/admin/CRMTable.tsx', content);
console.log('Success');
