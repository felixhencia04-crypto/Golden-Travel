import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useLogo } from '../utils/logo';

export default function Login() {
  const logoImg = useLogo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister && !name.trim()) {
      toast.error('Silakan masukkan nama lengkap Anda.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Format email tidak valid.');
      return;
    }

    if (password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true); 
    localStorage.removeItem('admin_token');
    
    let user: any = null;

    // 1. Try direct backend auth first for instant speed & high reliability
    try {
      const directRes = await api.post('/auth/direct-auth', {
        action: isRegister ? 'register' : 'login',
        email,
        password,
        name: isRegister ? name : undefined,
        role: 'jamaah'
      });

      if (directRes.token) {
        localStorage.setItem('jamaah_token', directRes.token);
      }
      user = directRes.user;

      // Try Firebase sign-in in background if possible for auth state sync
      try {
        if (isRegister) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (fbErr) {
        // Firebase error non-blocking if direct-auth succeeded
      }

    } catch (directErr: any) {
      console.warn('Direct auth failed, attempting Firebase Auth + Sync...', directErr);
      try {
        if (isRegister) {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          const { setPersistence, browserLocalPersistence, browserSessionPersistence } = await import('firebase/auth');
          await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
          await signInWithEmailAndPassword(auth, email, password);
        }
        
        const response = await api.post('/auth/sync', { name: isRegister ? name : undefined, role: 'jamaah' });
        if (response.token) {
          localStorage.setItem('jamaah_token', response.token);
        }
        user = response.user;
      } catch (error: any) {
        console.error('Login/Register error:', error);
        toast.error(error.message || (isRegister ? 'Pendaftaran gagal.' : 'Login gagal. Periksa email dan password Anda.'));
        setIsLoading(false);
        return;
      }
    }

    if (user) {
      toast.success(isRegister ? 'Pendaftaran berhasil! Selamat datang.' : 'Login berhasil!');
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'mitra') {
        navigate('/mitra/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
    setIsLoading(false);
  };


  const loginWithGoogle = async () => {
    setIsLoading(true); 
    localStorage.removeItem('admin_token');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const googleResult = await signInWithPopup(auth, provider);
      const response = await api.post('/auth/sync', {
        name: googleResult.user.displayName,
        role: 'jamaah'
      });
      if (response.token) {
        localStorage.setItem('jamaah_token', response.token);
      }
      const user = response.user;
      
      toast.success('Login dengan Google berhasil!');
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'mitra') {
        navigate('/mitra/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain ' + window.location.hostname + ' belum diizinkan di Firebase Console. Silakan tambahkan di Authentication > Settings > Authorized Domains.');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Metode login Google belum diaktifkan di Firebase Console. Silakan aktifkan di Authentication > Sign-in method.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Jendela login ditutup sebelum selesai.');
      } else {
        toast.error('Login dengan Google gagal: ' + (error.message || 'Kesalahan tidak diketahui'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
/* --- RESET PORTAL JAMAAH --- */
.jamaah-portal-wrapper {
    display: flex;
    min-height: 100vh;
    width: 100%;
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
}

/* --- PANEL KIRI --- */
.jamaah-left-panel {
    flex: 1.1;
    /* Deep Matcha Green Gradient yang sangat mewah */
    background: linear-gradient(135deg, #102618 0%, #0a170f 100%);
    background-image: radial-gradient(circle at top left, rgba(212, 175, 55, 0.08) 0%, transparent 40%), linear-gradient(135deg, #102618 0%, #0a170f 100%);
    padding: 4rem 5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #ffffff;
    position: relative;
}

.jamaah-brand-header {
    display: flex;
    align-items: center;
    gap: 15px;
}

.brand-logo-circle {
    width: 50px;
    height: 50px;
    background: #ffffff;
    color: #102618;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 1.2rem;
}

.brand-text-group h1 {
    color: #D4AF37;
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    margin: 0 0 2px 0;
    letter-spacing: 1px;
}

.brand-text-group span {
    color: #8c9e93;
    font-size: 0.75rem;
    letter-spacing: 2px;
}

.badge-exclusive {
    display: inline-block;
    background: rgba(212, 175, 55, 0.1);
    color: #D4AF37;
    padding: 6px 15px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    border: 1px solid rgba(212, 175, 55, 0.3);
    margin-bottom: 1.5rem;
    margin-top: 3rem;
}

.jamaah-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: 3.2rem;
    line-height: 1.2;
    margin-bottom: 1.2rem;
}

.jamaah-hero-title .gold-text {
    color: #D4AF37;
}

.jamaah-hero-desc {
    color: #a3b5aa;
    font-size: 1.1rem;
    line-height: 1.7;
    max-width: 90%;
    margin-bottom: 3rem;
}

.jamaah-feature-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.j-feature {
    display: flex;
    align-items: center;
    gap: 15px;
}

.j-icon {
    font-size: 1.5rem;
    background: rgba(255,255,255,0.05);
    width: 45px;
    height: 45px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
}

.j-text {
    display: flex;
    flex-direction: column;
}

.j-text strong {
    color: #ffffff;
    font-size: 1.05rem;
    margin-bottom: 3px;
}

.j-text span {
    color: #8c9e93;
    font-size: 0.9rem;
}

.back-link {
    color: #D4AF37;
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.3s;
}

.back-link:hover {
    color: #ffffff;
}

/* --- PANEL KANAN --- */
.jamaah-right-panel {
    flex: 1;
    background-color: #1a3622; /* Latar hijau matcha sedikit lebih terang dari kiri */
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
}

.jamaah-login-card {
    width: 100%;
    max-width: 450px;
    background: #ffffff; /* Kotak login putih agar sangat bersih dan kontras */
    border-radius: 24px;
    padding: 3rem;
    box-shadow: 0 25px 50px rgba(0,0,0,0.2);
}

.login-header-center {
    text-align: center;
    margin-bottom: 2.5rem;
}

.login-header-center h2 {
    font-family: 'Playfair Display', serif;
    color: #102618; /* Hijau gelap */
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
}

.login-header-center p {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
}

.gold-link {
    color: #b58d20;
    text-decoration: none;
    font-weight: bold;
}

.input-j-group {
    margin-bottom: 1.5rem;
}

.input-j-group label {
    display: block;
    color: #333;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.input-j-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.icon-input {
    position: absolute;
    left: 15px;
    color: #a0a0a0;
    font-size: 1.1rem;
}

.input-j-wrapper input {
    width: 100%;
    background: #f8f9f8;
    border: 1px solid #e0e5e2;
    padding: 14px 15px 14px 45px;
    border-radius: 12px;
    color: #333;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.input-j-wrapper input:focus {
    border-color: #D4AF37;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
}

.form-j-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.custom-check {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 0.9rem;
    cursor: pointer;
}

.forgot-link {
    color: #b58d20;
    text-decoration: none;
    font-size: 0.9rem;
}

.forgot-link:hover {
    text-decoration: underline;
}

.btn-masuk-gold {
    width: 100%;
    background: linear-gradient(45deg, #D4AF37, #AA771C);
    color: #000;
    border: none;
    padding: 15px;
    border-radius: 12px;
    font-size: 1.05rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
}

.btn-masuk-gold:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
}

.divider-text {
    text-align: center;
    margin: 2rem 0;
    position: relative;
}

.divider-text::before, .divider-text::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 25%;
    height: 1px;
    background: #e0e5e2;
}

.divider-text::before { left: 0; }
.divider-text::after { right: 0; }

.divider-text span {
    background: #ffffff;
    padding: 0 15px;
    color: #8c9e93;
    font-size: 0.85rem;
}

.btn-google-login {
    width: 100%;
    background: #ffffff;
    border: 1px solid #e0e5e2;
    color: #333;
    padding: 14px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
}

.btn-google-login img {
    width: 20px;
}

.btn-google-login:hover {
    background: #f8f9f8;
    border-color: #c0c5c2;
}

@media (max-width: 992px) {
    .jamaah-portal-wrapper {
        flex-direction: column;
    }
    .jamaah-left-panel {
        padding: 3rem 2rem;
    }
}
      `}} />
      
      <div className="jamaah-portal-wrapper">
          {/* PANEL KIRI: Edukasi & Sambutan */}
          <div className="jamaah-left-panel">
              <div className="jamaah-brand-header">
                  <div className="brand-logo-circle overflow-hidden p-0.5 bg-[#064e3b]">
                      <img src={logoImg} alt="Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div className="brand-text-group">
                      <h1>GOLDEN TRAVEL</h1>
                      <span>PT. GOLDEN TOUR HARAMAIN</span>
                  </div>
              </div>

              <div className="jamaah-welcome-content">
                  <div className="badge-exclusive">✨ PORTAL EKSKLUSIF JEMAAH</div>
                  <h2 className="jamaah-hero-title">Melayani Perjalanan Suci <br/><span className="gold-text">Sepenuh Hati</span></h2>
                  <p className="jamaah-hero-desc">
                      Selamat datang di ruang digital khusus Jemaah PT Golden Tour Haramain. Akses seluruh kebutuhan persiapan ibadah Anda dengan mudah, tenang, dan terorganisir dalam satu genggaman.
                  </p>

                  {/* Daftar Fitur Portal Jemaah */}
                  <div className="jamaah-feature-list">
                      <div className="j-feature">
                          <span className="j-icon">🕋</span>
                          <div className="j-text">
                              <strong>Itinerary & Jadwal Real-time</strong>
                              <span>Pantau rute perjalanan dan agenda harian Anda.</span>
                          </div>
                      </div>
                      <div className="j-feature">
                          <span className="j-icon">📚</span>
                          <div className="j-text">
                              <strong>Materi Manasik Digital</strong>
                              <span>Akses doa, panduan ibadah, dan video tutorial.</span>
                          </div>
                      </div>
                      <div className="j-feature">
                          <span className="j-icon">🎫</span>
                          <div className="j-text">
                              <strong>Dokumen Keberangkatan</strong>
                              <span>Unduh E-Ticket, Visa, dan manifest hotel Anda.</span>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="jamaah-footer-left">
                  <Link to="/" className="back-link">← Kembali ke Beranda</Link>
              </div>
          </div>

          {/* PANEL KANAN: Form Login */}
          <div className="jamaah-right-panel">
              <div className="jamaah-login-card">
                  <div className="login-header-center">
                      <h2>{isRegister ? 'Daftar Jamaah' : 'Portal Jamaah'}</h2>
                      <p>Masuk untuk mengakses layanan pemesanan dan jadwal. Atau login sebagai <Link to="/mitra/login" className="gold-link">Mitra</Link> atau <Link to="/admin/login" className="gold-link">Admin</Link></p>
                  </div>

                  <form className="jamaah-form-box" onSubmit={handleLogin}>
                      {isRegister && (
                        <div className="input-j-group animate-in fade-in slide-in-from-top-2 duration-300">
                            <label>Nama Lengkap</label>
                            <div className="input-j-wrapper">
                                <span className="icon-input">👤</span>
                                <input 
                                    type="text" 
                                    placeholder="Masukkan nama sesuai KTP/Paspor" 
                                    required={isRegister}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                      )}

                      <div className="input-j-group">
                          <label>Alamat Email</label>
                          <div className="input-j-wrapper">
                              <span className="icon-input">✉</span>
                              <input 
                                  type="email" 
                                  placeholder="anda@email.com" 
                                  required 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="input-j-group">
                          <label>Kata Sandi</label>
                          <div className="input-j-wrapper">
                              <span className="icon-input">🔒</span>
                              <input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  required 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="form-j-actions">
                          <label className="custom-check">
                              <input 
                                type="checkbox" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                              />
                              <span className="check-box"></span> Ingat saya
                          </label>
                          <a href="#" className="forgot-link">Lupa sandi?</a>
                      </div>

                      <button 
                        type="submit" 
                        className="btn-masuk-gold" 
                        disabled={isLoading}
                      >
                        {isLoading ? (isRegister ? 'Mendaftarkan...' : 'Memproses...') : (isRegister ? 'Daftar' : 'Masuk')} 
                        <span>→</span>
                      </button>
  <div style={{textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem'}}>
    {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
    <button type="button" onClick={() => setIsRegister(!isRegister)} style={{background: 'none', border: 'none', color: '#b58d20', cursor: 'pointer', fontWeight: 'bold'}}>
       {isRegister ? 'Masuk di sini' : 'Daftar di sini'}
    </button>
  </div>

                      <div className="divider-text">
                          <span>Atau lanjutkan dengan</span>
                      </div>

                      <button type="button" className="btn-google-login" onClick={() => loginWithGoogle()}>
                          <svg style={{width: '20px', height: '20px', marginRight: '8px'}} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Google
                      </button>
                  </form>
              </div>
          </div>
      </div>
    </>
  );
}
