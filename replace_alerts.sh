sed -i '437,613c\
/* --- AREA TINDAKAN DIPERLUKAN (TERANG / LIGHT MODE) --- */\
.portal-alert-section {\
    padding: 2rem 0; /* Sesuaikan dengan margin dashboard Anda */\
    font-family: '\''Inter'\'', sans-serif;\
}\
\
/* Header Section */\
.alert-header-area {\
    display: flex;\
    align-items: center;\
    gap: 12px;\
    margin-bottom: 1.5rem;\
}\
\
.alert-pulse-icon {\
    width: 28px;\
    height: 28px;\
    background: rgba(212, 175, 55, 0.15);\
    border: 1px solid #D4AF37;\
    color: #b58d20; /* Emas yang lebih gelap agar terbaca di background terang */\
    border-radius: 50%;\
    display: flex;\
    justify-content: center;\
    align-items: center;\
    font-size: 0.9rem;\
    font-weight: bold;\
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);\
    animation: pulseGoldLight 2s infinite;\
}\
\
@keyframes pulseGoldLight {\
    0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.3); }\
    70% { box-shadow: 0 0 0 8px rgba(212, 175, 55, 0); }\
    100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }\
}\
\
.alert-section-title {\
    color: #5c7063; /* Hijau Matcha medium untuk judul section */\
    font-size: 1rem;\
    font-weight: 700;\
    letter-spacing: 1px;\
    text-transform: uppercase;\
    margin: 0;\
}\
\
/* Layout Grid untuk Kartu */\
.alert-grid {\
    display: grid;\
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));\
    gap: 20px;\
}\
\
/* Style Dasar Kartu Alert (Terang) */\
.alert-card {\
    display: flex;\
    gap: 16px;\
    background: #ffffff; /* Background solid putih */\
    border: 1px solid #e2e8f0; /* Garis tepi abu-abu sangat tipis */\
    border-radius: 16px;\
    padding: 20px;\
    transition: all 0.3s ease;\
    position: relative;\
    overflow: hidden;\
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03); /* Bayangan lembut */\
}\
\
.alert-card:hover {\
    transform: translateY(-3px);\
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);\
}\
\
/* Icon Box di dalam Kartu */\
.alert-icon-box {\
    flex-shrink: 0;\
    width: 45px;\
    height: 45px;\
    border-radius: 12px;\
    display: flex;\
    justify-content: center;\
    align-items: center;\
    font-size: 1.2rem;\
}\
\
/* Konten Teks (Ubah jadi warna gelap) */\
.alert-content {\
    display: flex;\
    flex-direction: column;\
}\
\
.alert-content h3 {\
    color: #102116; /* Hijau Matcha Sangat Gelap (Nyaris Hitam) */\
    font-size: 1.1rem;\
    margin: 0 0 6px 0;\
    font-weight: 700;\
}\
\
.alert-content p {\
    color: #4a5b50; /* Abu-abu kehijauan (mudah dibaca di atas putih) */\
    font-size: 0.85rem;\
    line-height: 1.5;\
    margin: 0 0 15px 0;\
}\
\
.alert-action-btn {\
    align-self: flex-start;\
    font-size: 0.85rem;\
    font-weight: 700;\
    text-decoration: none;\
    display: flex;\
    align-items: center;\
    gap: 5px;\
    transition: all 0.3s ease;\
    text-transform: uppercase;\
    letter-spacing: 0.5px;\
}\
\
.alert-action-btn span {\
    transition: transform 0.3s ease;\
}\
\
.alert-action-btn:hover span {\
    transform: translateX(4px);\
}\
\
/* --- VARIAN WARNA INDIKATOR (Disempurnakan untuk bg terang) --- */\
\
/* 1. KRITIKAL (Merah) */\
.alert-critical {\
    border-left: 4px solid #e53e3e; /* Merah solid */\
    background: linear-gradient(90deg, rgba(229, 62, 62, 0.05) 0%, rgba(255,255,255,1) 60%);\
}\
.alert-critical .alert-icon-box {\
    background: rgba(229, 62, 62, 0.1);\
    color: #e53e3e;\
}\
.alert-critical .alert-action-btn { color: #e53e3e; }\
\
/* 2. WARNING / PEMBAYARAN (Emas) */\
.alert-warning {\
    border-left: 4px solid #D4AF37; /* Emas solid */\
    background: linear-gradient(90deg, rgba(212, 175, 55, 0.08) 0%, rgba(255,255,255,1) 60%);\
}\
.alert-warning .alert-icon-box {\
    background: rgba(212, 175, 55, 0.15);\
    color: #b58d20; /* Emas gelap agar kontras */\
}\
.alert-warning .alert-action-btn { color: #b58d20; }\
\
/* 3. INFO / DOKUMEN (Biru) */\
.alert-info {\
    border-left: 4px solid #3182ce; /* Biru solid */\
    background: linear-gradient(90deg, rgba(49, 130, 206, 0.05) 0%, rgba(255,255,255,1) 60%);\
}\
.alert-info .alert-icon-box {\
    background: rgba(49, 130, 206, 0.1);\
    color: #3182ce;\
}\
.alert-info .alert-action-btn { color: #3182ce; }\
\
/* Responsif Mobile */\
@media (max-width: 600px) {\
    .alert-grid { grid-template-columns: 1fr; }\
    .alert-card { padding: 15px; flex-direction: column; gap: 10px; }\
    .alert-icon-box { width: 35px; height: 35px; font-size: 1rem; }\
}\
' src/index.css
