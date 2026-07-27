import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { api } from '../lib/api';
import { toast } from 'sonner';

export default function LoginMitra() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Sync with backend
      const user = await api.post('/auth/sync', { role: 'mitra' });
      
      if (user.role !== 'mitra' && user.role !== 'admin') {
        throw new Error('Akses ditolak. Akun Anda bukan akun Mitra.');
      }
      
      toast.success('Login berhasil!');
      navigate('/mitra/dashboard');
    } catch (error: any) {
      console.error("Login failed", error);
      toast.error(error.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* --- RESET HALAMAN LOGIN MITRA --- */
        .ml-wrapper {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: radial-gradient(circle at center, #102618 0%, #050a07 100%);
            padding: 2rem;
        }

        /* Container Utama (Corporate Box) */
        .ml-container {
            display: flex;
            width: 100%;
            max-width: 950px;
            background: #0d1c13;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(212, 175, 55, 0.2);
        }

        /* --- SISI KIRI (PESAN BISNIS) --- */
        .ml-left {
            flex: 1;
            background: linear-gradient(145deg, #183823 0%, #0d1c13 100%);
            padding: 4rem;
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
            background-image: radial-gradient(rgba(212, 175, 55, 0.05) 2px, transparent 2px);
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
            width: 40px; height: 40px;
            background: #D4AF37;
            color: #0d1c13;
            border-radius: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            font-size: 1.1rem;
        }

        .ml-brand span {
            font-size: 0.85rem;
            letter-spacing: 2px;
            font-weight: 600;
            color: #a3b8aa;
        }

        .ml-title {
            font-family: 'Playfair Display', serif;
            font-size: 3.2rem;
            line-height: 1.1;
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            position: relative;
            z-index: 2;
        }

        .ml-desc {
            color: #c0d1c6;
            line-height: 1.7;
            font-size: 1.05rem;
            position: relative;
            z-index: 2;
        }

        .ml-testimonial {
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 2;
        }

        .ml-quote {
            font-style: italic;
            color: #D4AF37;
            font-size: 1rem;
            margin-bottom: 0.5rem;
        }

        .ml-author {
            color: #8fa697;
            font-size: 0.85rem;
        }

        /* --- SISI KANAN (FORM LOGIN) --- */
        .ml-right {
            flex: 1;
            background: #122419;
            padding: 4rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .ml-header-right {
            margin-bottom: 2.5rem;
        }

        .ml-back {
            display: inline-block;
            color: #8fa697;
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
            transition: color 0.3s;
        }

        .ml-back:hover { color: #D4AF37; }

        .ml-header-right h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .ml-header-right p { color: #8fa697; font-size: 0.95rem; }

        .ml-input-group {
            margin-bottom: 1.5rem;
        }

        .ml-input-group label {
            display: block;
            color: #c0d1c6;
            font-size: 0.9rem;
            margin-bottom: 0.6rem;
        }

        .ml-input-group input {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(212, 175, 55, 0.2);
            padding: 15px;
            border-radius: 12px;
            color: #ffffff;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
        }

        .ml-input-group input:focus {
            border-color: #D4AF37;
            background: rgba(212, 175, 55, 0.05);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .ml-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem;
        }

        .ml-check {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #8fa697;
            font-size: 0.9rem;
            cursor: pointer;
        }

        .ml-forgot {
            color: #D4AF37;
            text-decoration: none;
            font-size: 0.9rem;
        }

        .ml-forgot:hover { text-decoration: underline; }

        .ml-btn-submit {
            width: 100%;
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #0d1c13;
            border: none;
            padding: 16px;
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

        .ml-btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
        }

        .ml-btn-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .ml-register-prompt {
            margin-top: 2rem;
            text-align: center;
            color: #8fa697;
            font-size: 0.95rem;
        }

        .ml-register-prompt a {
            color: #D4AF37;
            text-decoration: none;
            font-weight: bold;
        }

        /* Responsif */
        @media (max-width: 850px) {
            .ml-container { flex-direction: column; }
            .ml-left { padding: 3rem; }
            .ml-right { padding: 3rem; }
        }
      `}} />

      <div className="ml-wrapper">
        <div className="ml-container">
            
            {/* Sisi Kiri: Pesan Bisnis */}
            <div className="ml-left">
                <div className="ml-brand">
                    <div className="ml-logo">GT</div>
                    <span>GOLDEN TRAVEL PARTNER</span>
                </div>
                <h2 className="ml-title">Akselerasi<br />Bisnis Anda.</h2>
                <p className="ml-desc">Masuk ke ruang kerja digital Anda. Pantau komisi, kelola data jemaah, dan akses materi promosi eksklusif dalam satu dasbor terpadu.</p>
                
                <div className="ml-testimonial">
                    <div className="ml-quote">"Sistem kemitraan yang transparan dan sangat mudah dijalankan."</div>
                    <div className="ml-author">- Mitra Resmi PT Golden Tour Haromain</div>
                </div>
            </div>

            {/* Sisi Kanan: Form Login */}
            <div className="ml-right">
                <div className="ml-header-right">
                    <Link to="/mitra" className="ml-back">← Kembali</Link>
                    <h3>Otorisasi Mitra</h3>
                    <p>Silakan masukkan kredensial akun bisnis Anda.</p>
                </div>

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
                            <input type="checkbox" />
                            <span className="ml-checkmark"></span> Ingat Sesi Ini
                        </label>
                        <a href="#" className="ml-forgot">Lupa Sandi?</a>
                    </div>

                    <button type="submit" className="ml-btn-submit" disabled={loading}>
                      {loading ? 'Memproses...' : 'Akses Dasbor Mitra'} <span>→</span>
                    </button>
                </form>

                <div className="ml-register-prompt">
                    Belum menjadi bagian dari kami? <Link to="/mitra">Ajukan Kemitraan</Link>
                </div>
            </div>

        </div>
      </div>
    </>
  );
}
