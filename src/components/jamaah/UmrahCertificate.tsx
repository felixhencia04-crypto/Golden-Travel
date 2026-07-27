import React from 'react';
import { motion } from 'motion/react';

interface UmrahCertificateProps {
  logoUrl?: string;
  noRegistrasi: string;
  namaJamaah: string;
  tahunIbadah: string;
  tanggalCetak: string;
}

export default function UmrahCertificate({ 
  logoUrl = '/logo.png', 
  noRegistrasi, 
  namaJamaah, 
  tahunIbadah, 
  tanggalCetak 
}: UmrahCertificateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="certificate-container"
      style={{
        width: '297mm',
        height: '210mm',
        padding: '10mm',
        margin: '0 auto',
        backgroundColor: '#fff',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        position: 'relative',
        color: '#1f3625',
        fontFamily: "'Georgia', serif",
      }}
    >
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        
        .cert-outer-border {
          border: 8px solid #bda054;
          padding: 8px;
          height: 100%;
          background: linear-gradient(135deg, #ffffff 0%, #eaf0eb 40%, #c4d6c8 100%);
        }
        .cert-inner-border {
          border: 2px solid #bda054;
          height: 100%;
          text-align: center;
          padding: 30px 40px;
          background-color: rgba(255, 255, 255, 0.45);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cert-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 130px;
          color: rgba(189, 160, 84, 0.07);
          z-index: 0;
          font-weight: bold;
          white-space: nowrap;
          letter-spacing: 10px;
          pointer-events: none;
        }
        .cert-content {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cert-logo {
          height: 60px;
          margin-bottom: 10px;
        }
        .cert-company {
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 3px;
          color: #152b1a;
          margin-bottom: 5px;
        }
        .cert-bismillah {
          font-size: 26px;
          color: #bda054;
          margin-bottom: 5px;
        }
        .cert-reg {
          font-size: 11px;
          color: #555;
          font-family: 'Arial', sans-serif;
          margin-bottom: 20px;
        }
        .cert-title {
          font-size: 44px;
          font-weight: bold;
          color: #152b1a;
          letter-spacing: 5px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        .cert-subtitle {
          font-size: 14px;
          color: #bda054;
          letter-spacing: 4px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .cert-prename {
          font-size: 14px;
          font-style: italic;
          color: #3a4f40;
          margin-bottom: 10px;
        }
        .cert-name {
          font-size: 38px;
          font-weight: bold;
          color: #bda054;
          text-transform: uppercase;
          border-bottom: 2px solid #bda054;
          display: inline-block;
          padding: 0 50px 8px 50px;
          margin-bottom: 15px;
        }
        .cert-description {
          font-size: 14px;
          line-height: 1.6;
          margin: 0 auto;
          width: 85%;
          color: #2a3d30;
          text-align: center;
        }
        .cert-footer {
          margin-top: auto;
          width: 100%;
          padding-bottom: 20px;
        }
        .cert-date {
          font-size: 13px;
          margin-bottom: 10px;
          color: #152b1a;
        }
        .cert-signature-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
        }
        .cert-sig-col {
          text-align: center;
          vertical-align: bottom;
          width: 33.33%;
        }
        .cert-sig-line {
          width: 70%;
          border-bottom: 1.5px solid #152b1a;
          margin: 50px auto 8px auto;
        }
        .cert-sig-title {
          font-weight: bold;
          font-size: 13px;
          color: #152b1a;
        }
        .cert-sig-sub {
          font-size: 11px;
          color: #555;
        }
      `}</style>

      <div className="cert-outer-border">
        <div className="cert-inner-border">
          <div className="cert-watermark">HARAMAIN</div>
          
          <div className="cert-content">
            <img src={logoUrl} className="cert-logo" alt="Logo" />
            
            <div className="cert-company">PT. GOLDEN TOUR HARAMAIN</div>
            <div className="cert-bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
            <div className="cert-reg">No. Reg: {noRegistrasi}</div>
            
            <div className="cert-title">SERTIFIKAT UMRAH</div>
            <div className="cert-subtitle">PIAGAM PENGHARGAAN & KENANG-KENANGAN</div>
            
            <div className="cert-prename">Diberikan dengan penuh rasa syukur kepada:</div>
            
            <div className="cert-name">{namaJamaah}</div>
            
            <div className="cert-description">
              Atas pelaksanaan Ibadah Umrah ke Tanah Suci, Makkah Al-Mukarramah dan Ziarah ke<br />
              Madinah Al-Munawwarah bersama <strong>PT. GOLDEN TOUR HARAMAIN</strong> pada program Haji & Umroh,<br />
              yang diselenggarakan pada tahun ibadah {tahunIbadah}.
              <br /><br />
              <i>Keluarga besar PT. Golden Tour Haramain mendoakan semoga Allah SWT menerima segala amal ibadah,<br />
              doa, dan zikir yang dipanjatkan, serta menjadikannya sebagai Umrah yang Mabrur. Amin Ya Rabbal Alamin.</i>
            </div>
            
            <div className="cert-footer">
              <div className="cert-date">Batam, {tanggalCetak}</div>
              
              <table className="cert-signature-table">
                <tbody>
                  <tr>
                    <td className="cert-sig-col">
                      <div className="cert-sig-line"></div>
                      <div className="cert-sig-title">DIREKTUR UTAMA</div>
                      <div className="cert-sig-sub">PT. GOLDEN TOUR HARAMAIN</div>
                    </td>
                    <td className="cert-sig-col"></td>
                    <td className="cert-sig-col">
                      <div className="cert-sig-line"></div>
                      <div className="cert-sig-title">PEMBIMBING IBADAH</div>
                      <div className="cert-sig-sub">Divisi Pelayanan Jamaah</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
