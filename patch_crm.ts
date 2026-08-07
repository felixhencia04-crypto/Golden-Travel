import fs from 'fs';

let content = fs.readFileSync('src/components/admin/CRMDetailDrawer.tsx', 'utf8');

const targetStr = `                    {!isUpdatingStatus ? (
                      <Button 
                        onClick={() => setIsUpdatingStatus(true)}
                        className="w-full bg-[#132019] hover:bg-black text-white font-bold h-12 rounded-2xl flex gap-2 items-center"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Ubah Status Manual
                      </Button>
                    ) : (`;

const replacementStr = `                    {!isUpdatingStatus ? (
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
                    ) : (`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/admin/CRMDetailDrawer.tsx', content);
  console.log('Success');
} else {
  console.log('Target string not found');
}
