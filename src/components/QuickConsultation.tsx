import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../store';


export default function QuickConsultation() {
  const { packages, addConsultation } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    packageId: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = packages.find(p => p.id === formData.packageId);
    
    addConsultation({
      id: Date.now().toString(),
      packageId: formData.packageId,
      packageName: pkg ? pkg.name : 'Belum Ditentukan',
      name: formData.name,
      phone: formData.phone,
      email: '',
      message: 'Konsultasi cepat dari halaman depan',
      status: 'new',
      createdAt: new Date().toISOString()
    });
    
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', phone: '', packageId: '' });
    }, 5000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden h-full flex flex-col justify-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      <h3 className="font-serif text-2xl font-bold text-matcha-950 mb-2 relative z-10">Konsultasi Cepat</h3>
      <p className="text-gray-500 text-sm mb-6 relative z-10">Tinggalkan kontak Anda, tim kami akan segera menghubungi.</p>

      {isSubmitted ? (
        <div className="text-center py-6 relative z-10 my-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-serif text-xl font-bold text-gray-900 mb-2">Terkirim!</h4>
          <p className="text-gray-600 font-light text-sm">
            Admin akan segera menghubungi Anda via WhatsApp.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border-gray-300 rounded-xl bg-gray-50 border py-2.5 px-4 focus:ring-gold-500 focus:border-gold-500 text-sm"
              placeholder="Contoh: Ahmad Abdullah"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
            <input 
              type="tel" 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border-gray-300 rounded-xl bg-gray-50 border py-2.5 px-4 focus:ring-gold-500 focus:border-gold-500 text-sm"
              placeholder="0812..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Minat Paket</label>
            <select 
              required
              value={formData.packageId}
              onChange={e => setFormData({...formData, packageId: e.target.value})}
              className="w-full border-gray-300 rounded-xl bg-gray-50 border py-2.5 px-4 focus:ring-gold-500 focus:border-gold-500 text-sm"
            >
              <option value="" disabled>Pilih Paket</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="font-button w-full flex justify-center items-center px-6 py-3 text-sm font-bold rounded-xl text-matcha-950 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 shadow-md shadow-gold-500/20 transition-all hover:-translate-y-0.5 mt-2"
          >
            Kirim <Send className="ml-2 w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
