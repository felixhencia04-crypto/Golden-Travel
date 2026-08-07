const fs = require('fs');
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

// Add excludes to initial formData
code = code.replace(
  /hotel: pkg\?\.hotel \|\| '',/g,
  'hotel: pkg?.hotel || \'\',\n    excludes: Array.isArray(pkg?.excludes) ? pkg.excludes.join(\'\\n\') : (pkg?.excludes || \'\'),'
);

// Replace imageUrl input with file input logic
const imageUploadCode = `<div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gambar (Opsional)</label>
                    <div className="flex items-center space-x-4">
                      {formData.imageUrl && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
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
                            setFormData({...formData, imageUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                      />
                    </div>
                  </div>`;

code = code.replace(
  /<div[^>]*>\s*<label[^>]*>URL Gambar \(Opsional\)<\/label>\s*<input\s*type="text"\s*value=\{formData\.imageUrl\}[^>]*>\s*<\/div>/g,
  imageUploadCode
);

// Add excludes textarea below description
const excludesCode = `<div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Belum Termasuk / Excludes (Satu per baris)</label>
                <textarea 
                  value={formData.excludes}
                  onChange={(e) => setFormData({...formData, excludes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none resize-none"
                  placeholder="Pembuatan Paspor&#10;Vaksin Meningitis&#10;Pengeluaran Pribadi"
                />
              </div>`;

code = code.replace(
  /<\/form>/,
  excludesCode + '\n            </form>'
);

// When saving, parse excludes if it's text
const submitLogic = `const payload = {
        ...formData,
        description: formData.description.split('\\n').filter(d => d.trim() !== ''),
        excludes: formData.excludes.split('\\n').filter(d => d.trim() !== ''),
      };`;
      
code = code.replace(
  /const payload = \{\n\s*\.\.\.formData,\n\s*description: formData\.description\.split\('\\\\n'\)\.filter\(d => d\.trim\(\) !== ''\)\n\s*\};/,
  submitLogic
);
code = code.replace(
  /const payload = \{\n\s*\.\.\.formData,\n\s*description: formData\.description\.split\('\\\\n'\)\.filter\(\(d: string\) => d\.trim\(\) !== ''\)\n\s*\};/,
  submitLogic
);

fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
