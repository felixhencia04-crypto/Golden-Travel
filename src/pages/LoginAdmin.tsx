import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useLogo } from '../utils/logo';

export default function LoginAdmin() {
  const logoImg = useLogo();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use custom API endpoint for admin login (no email required)
      const res = await api.post('/admin/login', { password: password.trim() });
      
      if (res.token) {
        localStorage.setItem('admin_token', res.token);
        sessionStorage.setItem('admin_token', res.token);
        sessionStorage.removeItem("cached_admin_portal_data");
        toast.success('Selamat datang, Admin!');
        navigate('/admin');
      } else {
        toast.error('Kata sandi salah.');
      }
    } catch (error: any) {
      console.error("Admin login failed", error);
      toast.error(error.message || 'Login admin gagal. Periksa kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* --- RESET KHUSUS HALAMAN ADMIN --- */
        .admin-portal-wrapper {
            display: flex;
            min-height: 100vh;
            width: 100%;
            font-family: 'Inter', sans-serif; /* Font modern untuk dashboard */
            background-color: #050a07; /* Sangat gelap, bias hijau */
            margin: 0;
            padding: 0;
        }
        
        /* --- PANEL KIRI (DEEP MATCHA) --- */
        .admin-left-panel {
            flex: 1.2;
            /* Gradasi Hijau Matcha Gelap yang Elegan */
            background: linear-gradient(145deg, #153221 0%, #08160e 100%);
            /* Efek tekstur bintik halus (opsional untuk menambah kemewahan) */
            background-image: radial-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px), linear-gradient(145deg, #153221 0%, #08160e 100%);
            background-size: 30px 30px, 100% 100%;
            padding: 4rem 5rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border-right: 1px solid rgba(212, 175, 55, 0.15);
            position: relative;
            overflow: hidden;
        }
        
        /* Navigasi Atas Kiri */
        .admin-header-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .admin-brand {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .brand-circle {
            width: 45px;
            height: 45px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            color: #08160e;
            font-size: 1.2rem;
        }
        
        .brand-text h1 {
            color: #D4AF37;
            font-family: 'Playfair Display', serif;
            font-size: 1.2rem;
            margin: 0;
            letter-spacing: 1px;
        }
        
        .brand-text span {
            color: #8c9e93; /* Hijau pucat */
            font-size: 0.7rem;
            letter-spacing: 2px;
        }
        
        .btn-back-home {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a0a0a0;
            text-decoration: none;
            font-size: 0.9rem;
            padding: 8px 16px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            transition: all 0.3s ease;
        }
        
        .btn-back-home:hover {
            color: #ffffff;
            background: rgba(255,255,255,0.05);
            border-color: #D4AF37;
        }
        
        /* Teks Utama Kiri */
        .admin-hero-text h2 {
            font-family: 'Playfair Display', serif;
            font-size: 3.5rem;
            color: #ffffff;
            line-height: 1.2;
            margin-bottom: 1.5rem;
        }
        
        .admin-hero-text .gold-text {
            color: #D4AF37;
        }
        
        .admin-hero-text p {
            color: #9cb0a4; /* Hijau keabu-abuan terang */
            font-size: 1.1rem;
            line-height: 1.6;
            max-width: 80%;
        }
        
        /* Fitur Kiri */
        .admin-features {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        
        .feature-item {
            display: flex;
            gap: 15px;
            align-items: flex-start;
        }
        
        .feature-icon {
            width: 40px;
            height: 40px;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #D4AF37;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 10px;
            font-size: 1.2rem;
            flex-shrink: 0;
        }
        
        .feature-desc h3 {
            color: #ffffff;
            font-size: 1.1rem;
            margin-bottom: 0.3rem;
        }
        
        .feature-desc p {
            color: #8c9e93;
            font-size: 0.9rem;
            line-height: 1.5;
            margin: 0;
        }
        
        /* --- PANEL KANAN (FORM LOGIN) --- */
        .admin-right-panel {
            flex: 1;
            background-color: #050b08; /* Hitam dengan undertone hijau */
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        
        .login-box {
            width: 100%;
            max-width: 420px;
            background: rgba(18, 38, 25, 0.3); /* Kotak form transparan hijau */
            border: 1px solid rgba(212, 175, 55, 0.1);
            padding: 3rem;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        
        .login-header {
            text-align: center;
            margin-bottom: 2.5rem;
        }
        
        .login-header h2 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 2.2rem;
            margin-bottom: 0.5rem;
        }
        
        .login-header p {
            color: #7b8e83;
            font-size: 0.9rem;
        }
        
        /* Input Form */
        .input-group {
            margin-bottom: 1.5rem;
        }
        
        .label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .input-group label {
            display: block;
            color: #c0c0c0;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        
        .forgot-password {
            color: #D4AF37;
            text-decoration: none;
            font-size: 0.85rem;
            transition: color 0.3s;
        }
        
        .forgot-password:hover {
            color: #ffffff;
        }
        
        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        
        .input-icon {
            position: absolute;
            left: 15px;
            color: #7b8e83;
            font-size: 1.2rem;
        }
        
        .input-wrapper input {
            width: 100%;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(212, 175, 55, 0.2);
            padding: 14px 15px 14px 45px;
            border-radius: 10px;
            color: #ffffff;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        
        .input-wrapper input:focus {
            border-color: #D4AF37;
            background: rgba(212, 175, 55, 0.05);
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
        }
        
        .input-wrapper input::placeholder {
            color: #4a5c51;
        }
        
        /* Checkbox */
        .remember-row {
            margin-bottom: 2rem;
        }
        
        .custom-checkbox {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #a0a0a0;
            font-size: 0.9rem;
            cursor: pointer;
        }
        
        /* Tombol Submit */
        .btn-login-submit {
            width: 100%;
            background: linear-gradient(45deg, #D4AF37, #b58d20);
            color: #050b08;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1.05rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-login-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.25);
        }

        .btn-login-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        /* Responsif untuk layar kecil */
        @media (max-width: 992px) {
            .admin-portal-wrapper {
                flex-direction: column;
            }
            .admin-left-panel {
                padding: 3rem 2rem;
            }
        }
      `}} />

      <div className="admin-portal-wrapper">
          {/* Panel Kiri: Informasi (Nuansa Deep Matcha) */}
          <div className="admin-left-panel">
              <div className="admin-header-nav">
                  <div className="admin-brand">
                      <div className="brand-circle overflow-hidden p-0.5 bg-[#064e3b]">
                          <img src={logoImg} alt="Logo" className="w-full h-full object-contain rounded-full" />
                      </div> 
                      <div className="brand-text">
                          <h1>GOLDEN TOUR HARAMAIN</h1>
                          <span>PORTAL ADMINISTRATOR</span>
                      </div>
                  </div>
                  <Link to="/" className="btn-back-home">
                      <span className="icon">⌂</span> Kembali ke Beranda
                  </Link>
              </div>

              <div className="admin-hero-text">
                  <h2>Pusat Kendali<br/><span className="gold-text">Layanan Umrah & Haji</span></h2>
                  <p>Kelola seluruh operasional biro perjalanan Anda dalam satu dashboard terintegrasi yang eksklusif dan aman.</p>
              </div>

              <div className="admin-features">
                  <div className="feature-item">
                      <div className="feature-icon">👥</div>
                      <div className="feature-desc">
                          <h3>Manajemen Jemaah Komprehensif</h3>
                          <p>Pantau pendaftaran, dokumen keberangkatan, dan status pembayaran jemaah secara real-time.</p>
                      </div>
                  </div>
                  <div className="feature-item">
                      <div className="feature-icon">✈️</div>
                      <div className="feature-desc">
                          <h3>Jadwal & Akomodasi</h3>
                          <p>Pengaturan jadwal penerbangan, manifestasi hotel di Makkah & Madinah, serta transportasi.</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Panel Kanan: Form Login */}
          <div className="admin-right-panel">
              <div className="login-box">
                  <div className="login-header">
                      <h2>Otorisasi Akses</h2>
                      <p>Silakan masuk menggunakan kredensial administrator Anda.</p>
                  </div>

                  <form className="login-form" onSubmit={handleLogin}>
                      <div className="input-group">
                          <div className="label-row">
                              <label>Kata Sandi</label>
                          </div>
                          <div className="input-wrapper">
                              <span className="input-icon">🔒</span>
                              <input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="remember-row">
                          <label className="custom-checkbox">
                              <input 
                                type="checkbox" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                              />
                              <span className="checkmark"></span>
                              Ingat perangkat ini
                          </label>
                      </div>

                      <button type="submit" className="btn-login-submit" disabled={loading}>
                        {loading ? 'Memverifikasi...' : 'Masuk Portal →'}
                      </button>
                      
                      
                  </form>
              </div>
          </div>
      </div>
    </>
  );
}

