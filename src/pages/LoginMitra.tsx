import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useLogo } from '../utils/logo';
import { setActiveMitraInfo } from '../utils/mitraStorage';
import { Briefcase, UserCheck, ShieldCheck, Mail, Lock, User, Phone, MapPin, CheckCircle, ArrowRight, X } from 'lucide-react';

export default function LoginMitra() {
  const logoImg = useLogo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration specific states
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('freelance');

  const [loading, setLoading] = useState(false);

  // Format auth error messages into clear, professional Indonesian notices
  const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return 'Login gagal. Periksa email dan kata sandi Anda.';
    
    const msg = typeof error === 'string' ? error : (error.message || '');
    const code = error.code || '';

    if (
      code === 'auth/wrong-password' || 
      code === 'auth/invalid-credential' ||
      msg.includes('wrong-password') || 
      msg.includes('invalid-credential') ||
      msg.toLowerCase().includes('kata sandi yang anda masukkan salah') ||
      msg.toLowerCase().includes('password salah') ||
      msg.toLowerCase().includes('invalid password')
    ) {
      return 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.';
    }

    if (
      code === 'auth/user-not-found' || 
      msg.includes('user-not-found') ||
      msg.toLowerCase().includes('email belum terdaftar') ||
      msg.toLowerCase().includes('user not found')
    ) {
      return 'Email belum terdaftar. Silakan periksa kembali email Anda atau mendaftar Mitra Baru.';
    }

    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.';
    }

    if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
      return 'Terlalu banyak percobaan login. Silakan coba lagi setelah beberapa saat.';
    }

    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return 'Format alamat email tidak valid.';
    }

    if (msg.startsWith('Firebase: Error')) {
      return 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.';
    }

    return msg || 'Login gagal. Periksa email dan kata sandi Anda.';
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Silakan masukkan email kemitraan Anda.');
      return;
    }
    if (!password) {
      toast.error('Silakan masukkan kata sandi Anda.');
      return;
    }

    setLoading(true);
    let user: any = null;

    try {
      const directRes = await api.post('/auth/direct-auth', {
        action: 'login',
        email,
        password,
        role: 'mitra'
      });

      if (directRes.token) {
        localStorage.setItem('mitra_token', directRes.token);
      }
      user = directRes.user;

      // Background non-blocking Firebase sync
      signInWithEmailAndPassword(auth, email, password).catch(() => {});
    } catch (directErr: any) {
      console.error("Direct auth login failed:", directErr);
      const friendlyMsg = getFriendlyErrorMessage(directErr);
      toast.error(friendlyMsg);
      setLoading(false);
      return;
    }

    if (user) {
      if (user.role !== 'mitra' && user.role !== 'admin') {
        toast.error('Akses ditolak. Akun Anda bukan terdaftar sebagai akun Mitra.');
        setLoading(false);
        return;
      }
      setActiveMitraInfo({
        id: user.id || user.email,
        email: user.email || '',
        name: user.name || user.fullName || fullName || ''
      });
      localStorage.setItem('mitra_profile', JSON.stringify({
        id: user.id || user.email,
        email: user.email || '',
        name: user.name || user.fullName || fullName || '',
        fullName: user.name || user.fullName || fullName || ''
      }));
      toast.success('Login berhasil! Selamat datang di Portal Kemitraan.');
      navigate('/mitra/dashboard');
    }
    setLoading(false);
  };

  // Handle In-App Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Mohon lengkapi nama, email, dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/direct-auth', {
        action: 'register',
        email,
        password,
        name: fullName,
        role: 'mitra',
        whatsapp,
        city,
        category
      });

      if (response.token) {
        localStorage.setItem('mitra_token', response.token);
      }

      const regUser = response.user;
      setActiveMitraInfo({
        id: regUser?.id || email,
        email: email,
        name: fullName
      });
      localStorage.setItem('mitra_profile', JSON.stringify({
        id: regUser?.id || email,
        email: email,
        name: fullName,
        fullName: fullName
      }));

      toast.success('Pendaftaran Mitra Berhasil! Akun Anda telah aktif.');
      navigate('/mitra/dashboard');
    } catch (err: any) {
      console.error("Registration failed", err);
      toast.error(err.message || 'Gagal mendaftar Mitra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .ml-wrapper {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: radial-gradient(circle at center, #102618 0%, #050a07 100%);
            padding: 2rem 1rem;
        }

        .ml-container {
            display: flex;
            width: 100%;
            max-width: 980px;
            background: #0d1c13;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(212, 175, 55, 0.25);
        }

        .ml-left {
            flex: 1;
            background: linear-gradient(145deg, #183823 0%, #0d1c13 100%);
            padding: 3.5rem 3rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: #ffffff;
            position: relative;
        }

        .ml-left::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: radial-gradient(rgba(212, 175, 55, 0.08) 2px, transparent 2px);
            background-size: 30px 30px;
            pointer-events: none;
        }

        .ml-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
            z-index: 2;
        }

        .ml-logo {
            width: 42px; height: 42px;
            background: #D4AF37;
            color: #0d1c13;
            border-radius: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
        }

        .ml-brand span {
            font-size: 0.8rem;
            letter-spacing: 2px;
            font-weight: 700;
            color: #D4AF37;
        }

        .ml-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            line-height: 1.15;
            margin-top: 2.5rem;
            margin-bottom: 1.2rem;
            position: relative;
            z-index: 2;
        }

        .ml-desc {
            color: #c0d1c6;
            line-height: 1.7;
            font-size: 1rem;
            position: relative;
            z-index: 2;
        }

        .ml-testimonial {
            margin-top: 3rem;
            padding-top: 1.8rem;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
            position: relative;
            z-index: 2;
        }

        .ml-quote {
            font-style: italic;
            color: #f3d373;
            font-size: 0.95rem;
            margin-bottom: 0.4rem;
        }

        .ml-author {
            color: #8fa697;
            font-size: 0.85rem;
        }

        .ml-right {
            flex: 1.1;
            background: #122419;
            padding: 3.5rem 3rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .ml-header-right {
            margin-bottom: 2rem;
        }

        .ml-back {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #8fa697;
            text-decoration: none;
            font-size: 0.85rem;
            margin-bottom: 1.2rem;
            transition: color 0.3s;
        }

        .ml-back:hover { color: #D4AF37; }

        .ml-header-right h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 2.2rem;
            margin-bottom: 0.4rem;
        }

        .ml-header-right p { color: #a3b8aa; font-size: 0.9rem; }

        /* TAB SWITCHER */
        .ml-tabs {
            display: flex;
            background: rgba(0, 0, 0, 0.4);
            padding: 4px;
            border-radius: 14px;
            border: 1px solid rgba(212, 175, 55, 0.2);
            margin-bottom: 1.8rem;
        }

        .ml-tab-btn {
            flex: 1;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 0.88rem;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #a3b8aa;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .ml-tab-btn.active {
            background: linear-gradient(135deg, #D4AF37, #AA771C);
            color: #04170d;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
        }

        .ml-input-group {
            margin-bottom: 1.2rem;
        }

        .ml-input-group label {
            display: block;
            color: #c0d1c6;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .ml-input-group input, .ml-input-group select {
            width: 100%;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(212, 175, 55, 0.25);
            padding: 13px 15px;
            border-radius: 12px;
            color: #ffffff;
            font-size: 0.95rem;
            outline: none;
            transition: all 0.3s ease;
        }

        .ml-input-group select option {
            background-color: #0d1c13 !important;
            color: #ffffff !important;
            padding: 12px 16px;
            font-weight: 600;
        }

        .ml-input-group select option:checked,
        .ml-input-group select option:hover {
            background-color: #183823 !important;
            color: #D4AF37 !important;
        }

        .ml-input-group input:focus, .ml-input-group select:focus {
            border-color: #D4AF37;
            background: rgba(212, 175, 55, 0.08);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
        }

        .ml-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.8rem;
        }

        .ml-check {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #8fa697;
            font-size: 0.85rem;
            cursor: pointer;
        }

        .ml-forgot {
            color: #D4AF37;
            text-decoration: none;
            font-size: 0.85rem;
        }

        .ml-forgot:hover { text-decoration: underline; }

        .ml-btn-submit {
            width: 100%;
            background: linear-gradient(135deg, #D4AF37, #AA771C);
            color: #0d1c13;
            border: none;
            padding: 15px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.2);
        }

        .ml-btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(212, 175, 55, 0.35);
        }

        .ml-btn-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        @media (max-width: 850px) {
            .ml-container { flex-direction: column; }
            .ml-left { padding: 2.5rem 2rem; }
            .ml-right { padding: 2.5rem 2rem; }
        }
      `}} />

      <div className="ml-wrapper">
        <div className="ml-container">
            
            {/* Sisi Kiri: Pesan Bisnis */}
            <div className="ml-left">
                <div className="ml-brand">
                    <div className="ml-logo overflow-hidden p-0.5 bg-[#064e3b]">
                        <img src={logoImg} alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <span>PT. GOLDEN TOUR HARAMAIN PARTNER</span>
                </div>
                <h2 className="ml-title">
                  {activeTab === 'login' ? 'Akselerasi Bisnis Anda.' : 'Bergabung Kemitraan.'}
                </h2>
                <p className="ml-desc">
                  {activeTab === 'login' 
                    ? 'Masuk ke ruang kerja digital Anda. Pantau komisi, kelola data jemaah, dan akses materi promosi eksklusif dalam satu dasbor terpadu.'
                    : 'Daftarkan diri Anda sebagai perwakilan resmi. Dapatkan komisi tak terbatas, materi pemasaran lengkap, dan pendampingan bisnis hingga sukses.'
                  }
                </p>
                
                <div className="ml-testimonial">
                    <div className="ml-quote">"Sistem kemitraan yang transparan, modern, dan sangat mudah dijalankan."</div>
                    <div className="ml-author">- Mitra Resmi PT. Golden Tour Haramain</div>
                </div>
            </div>

            {/* Sisi Kanan: Form Otorisasi & Pendaftaran */}
            <div className="ml-right">
                <div className="ml-header-right">
                    <Link to="/" className="ml-back">
                      ← Kembali ke Beranda
                    </Link>
                    <h3>Portal Kemitraan</h3>
                    <p>
                      {activeTab === 'login' ? 'Silakan masuk ke akun bisnis Anda' : 'Lengkapi formulir pendaftaran Mitra Baru'}
                    </p>
                </div>

                {/* TAB SWITCHER */}
                <div className="ml-tabs">
                    <button 
                      type="button"
                      onClick={() => setActiveTab('login')} 
                      className={`ml-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Masuk Mitra</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('register')} 
                      className={`ml-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Daftar Mitra Baru</span>
                    </button>
                </div>

                {/* FORM LOGIN */}
                {activeTab === 'login' ? (
                  <form className="ml-form" onSubmit={handleLogin}>
                      <div className="ml-input-group">
                          <label>Email Kemitraan</label>
                          <input 
                            type="email" 
                            placeholder="emailbisnis@domain.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                      </div>

                      <div className="ml-input-group">
                          <label>Kata Sandi</label>
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                      </div>

                      <div className="ml-actions">
                          <label className="ml-check">
                              <input type="checkbox" defaultChecked />
                              <span className="ml-checkmark"></span> Ingat Sesi Ini
                          </label>
                          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Fitur reset password dikirimkan ke email terdaftar Anda.'); }} className="ml-forgot">Lupa Sandi?</a>
                      </div>

                      <button type="submit" className="ml-btn-submit" disabled={loading}>
                        {loading ? 'Memproses...' : 'Akses Dasbor Mitra'} <span>→</span>
                      </button>
                  </form>
                ) : (
                  /* FORM DAFTAR MITRA BARU (IN-APP) */
                  <form className="ml-form" onSubmit={handleRegister}>
                      <div className="ml-input-group">
                          <label>Nama Lengkap Sesuai KTP *</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Ahmad Subagyo" 
                            required 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                      </div>

                      <div className="ml-input-group">
                          <label>Email Bisnis / Kemitraan *</label>
                          <input 
                            type="email" 
                            placeholder="nama@domain.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="ml-input-group">
                            <label>Nomor WhatsApp *</label>
                            <input 
                              type="tel" 
                              placeholder="0812-xxxx-xxxx" 
                              required 
                              value={whatsapp}
                              onChange={(e) => setWhatsapp(e.target.value)}
                            />
                        </div>
                        <div className="ml-input-group">
                            <label>Kota Domisili *</label>
                            <input 
                              type="text" 
                              placeholder="Kota Batam" 
                              required 
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                      </div>

                      <div className="ml-input-group">
                          <label>Kategori Kemitraan *</label>
                          <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="bg-[#0d1c13] text-white"
                          >
                            <option value="freelance" className="bg-[#0d1c13] text-white py-2 font-semibold">Mitra Lepas (Freelance)</option>
                            <option value="agen" className="bg-[#0d1c13] text-white py-2 font-semibold">Agen Resmi Daerah</option>
                            <option value="cabang" className="bg-[#0d1c13] text-white py-2 font-semibold">Kantor Cabang Daerah</option>
                          </select>
                      </div>

                      <div className="ml-input-group">
                          <label>Buat Kata Sandi *</label>
                          <input 
                            type="password" 
                            placeholder="Minimal 6 karakter" 
                            required 
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                      </div>

                      <button type="submit" className="ml-btn-submit" disabled={loading}>
                        {loading ? 'Memproses Pendaftaran...' : 'Daftar & Akses Dasbor Mitra'} <span>→</span>
                      </button>
                  </form>
                )}

            </div>

        </div>
      </div>
    </>
  );
}
