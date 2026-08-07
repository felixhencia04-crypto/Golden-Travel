import fs from 'fs';

let content = fs.readFileSync('src/components/admin/CRMTable.tsx', 'utf8');

const targetStr = `      {/* Detail Drawer */}
      <CRMDetailDrawer 
        registration={selectedReg} 
        onClose={() => setSelectedReg(null)} 
      />
    </div>
  );
};`;

const replacementStr = `      {/* Detail Drawer */}
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
            <h2 className="text-xl font-black text-center mb-2">Hapus Jamaah?</h2>
            <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed">
              Tindakan ini akan menghapus permanen data jamaah beserta seluruh dokumen, pembayaran, dan riwayat yang terkait. Tindakan ini tidak dapat dibatalkan.
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
};`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/admin/CRMTable.tsx', content);
  console.log('Success');
} else {
  console.log('Target string not found');
}
