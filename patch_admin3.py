import re

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

replacement = """                  <p className="font-bold text-gray-900 text-lg">
                    {(editingTransaksi.pendingPaymentStep || editingTransaksi.paymentStep) === 'dp1' ? 'Rp 1.500.000' : 
                     (editingTransaksi.pendingPaymentStep || editingTransaksi.paymentStep) === 'dp2' ? 'Rp 5.000.000' : 
                     (editingTransaksi.pendingPaymentStep || editingTransaksi.paymentStep) === 'lunas' ? 'Lunas' : 'Menunggu Pembayaran'}
                  </p>"""

pattern = re.compile(r'                  <p className="font-bold text-gray-900 text-lg">.*?Menunggu Pelunasan\'}\s*</p>', re.DOTALL)
content = pattern.sub(replacement, content)

replacement_type = """                <div>
                  <p className="text-xs text-gray-500 mb-1">Jenis Transaksi</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {(editingTransaksi.pendingPaymentStep || editingTransaksi.paymentStep)?.toUpperCase()}
                  </span>
                </div>"""

pattern_type = re.compile(r'                <div>\s*<p className="text-xs text-gray-500 mb-1">Jenis Transaksi</p>\s*<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">\s*\{editingTransaksi\.paymentStep\?\.toUpperCase\(\)\}\s*</span>\s*</div>', re.DOTALL)
content = pattern_type.sub(replacement_type, content)

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)
print("Done")
