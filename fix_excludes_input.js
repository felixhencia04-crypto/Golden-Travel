import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const regexDesc = /(<div>\s*<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1\.5">Deskripsi Lengkap \(Satu per baris\)<\/label>\s*<textarea\s*value=\{formData\.description\}\s*onChange=\{\(e\) => setFormData\(\{\.\.\.formData, description: e\.target\.value\}\)\}\s*rows=\{4\}\s*className="w-full px-4 py-2\.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500\/20 focus:border-gold-500 transition-all outline-none resize-none"\s*placeholder="Fasilitas Bintang 5&\#10;Pesawat Saudi Airlines&\#10;Muthawwif Berpengalaman"\s*\/>\s*<\/div>)/;

const excludesFieldCode = `
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Belum Termasuk / Excludes (Satu per baris)</label>
                <textarea 
                  value={formData.excludes}
                  onChange={(e) => setFormData({...formData, excludes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none resize-none"
                  placeholder="Pembuatan Paspor&#10;Vaksin Meningitis&#10;Pengeluaran Pribadi"
                />
              </div>`;

if(regexDesc.test(code)) {
  code = code.replace(regexDesc, "$1\n" + excludesFieldCode);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success excludes added");
} else {
  console.log("Regex desc not found");
}
