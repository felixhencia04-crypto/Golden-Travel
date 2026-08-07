import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const regex = /<div>\s*<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1\.5">URL Gambar \(Opsional\)<\/label>\s*<input\s*type="text"\s*value=\{formData\.imageUrl\}\s*onChange=\{\(e\) => setFormData\(\{\.\.\.formData, imageUrl: e\.target\.value\}\)\}\s*className="w-full px-4 py-2\.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500\/20 focus:border-gold-500 transition-all outline-none"\s*placeholder="https:\/\/..."\s*\/>\s*<\/div>/;

const imageUploadCode = `<div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gambar (Opsional)</label>
                    <div className="flex items-center space-x-4">
                      {formData.imageUrl && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, imageUrl: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="flex-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none text-xs"
                      />
                    </div>
                  </div>`;

if(regex.test(code)) {
  code = code.replace(regex, imageUploadCode);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success");
} else {
  console.log("Regex not found");
}
