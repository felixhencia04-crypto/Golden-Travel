import re

with open("src/pages/DashboardJamaah.tsx", "r") as f:
    content = f.read()

target = """                        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Keberangkatan (Pax)</label>
                          <select 
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none font-medium"
                            value={userConsultation?.paxCount || 1}
                            onChange={(e) => {
                              if (userConsultation) {
                                updateConsultation({ ...userConsultation, paxCount: parseInt(e.target.value) });
                              }
                            }}
                          >
                            {[1, 2, 3, 4, 5, 6].map(num => (
                              <option key={num} value={num}>{num} Orang</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-2">Total Harga: <span className="font-bold text-gray-900">Rp {(currentPackage.price * paxCount).toLocaleString('id-ID')}</span></p>
                        </div>"""

replacement = """                        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Keberangkatan (Pax)</label>
                          <div className="relative">
                            <input 
                              type="number"
                              min="1"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none font-medium pr-20"
                              value={userConsultation?.paxCount || 1}
                              onChange={(e) => {
                                if (userConsultation) {
                                  const val = parseInt(e.target.value);
                                  updateConsultation({ ...userConsultation, paxCount: isNaN(val) || val < 1 ? 1 : val });
                                }
                              }}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">Orang</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Total Harga: <span className="font-bold text-gray-900">Rp {(currentPackage.price * paxCount).toLocaleString('id-ID')}</span></p>
                        </div>"""

new_content = content.replace(target, replacement)

if new_content != content:
    with open("src/pages/DashboardJamaah.tsx", "w") as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Target not found")
