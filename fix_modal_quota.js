import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const modalStateRegex = /const \[formData, setFormData\] = useState\(\{([\s\S]*?)\}\);/;
code = code.replace(modalStateRegex, (match, inner) => {
  if (!inner.includes('quota:')) {
    return `const [formData, setFormData] = useState({${inner},
    quota: pkg?.quota || 45
  });`;
  }
  return match;
});

const formReplaceRegex = /<div className="grid grid-cols-2 gap-4">\s*<div>\s*<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1\.5">Harga \(Rp\)<\/label>[\s\S]*?<\/div>\s*<div>\s*<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1\.5">Durasi<\/label>[\s\S]*?<\/div>\s*<\/div>/;

const newFormPart = `<div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Harga (Rp)</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                        placeholder="35000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Kuota / Total Seat</label>
                      <input 
                        type="number" 
                        value={formData.quota}
                        onChange={(e) => setFormData({...formData, quota: Number(e.target.value)})}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                        placeholder="45"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Durasi</label>
                    <input 
                      type="text" 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                      placeholder="9 Hari"
                    />
                  </div>`;

if (formReplaceRegex.test(code)) {
  code = code.replace(formReplaceRegex, newFormPart);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success quota form");
} else {
  console.log("Regex not found formReplaceRegex");
}
