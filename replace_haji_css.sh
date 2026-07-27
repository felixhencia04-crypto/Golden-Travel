sed -i '782,984c\
        /* --- SECTION PAKET HAJI --- */\
        .mitra-haji-section {\
            background-color: #050a07; /* Konsisten dengan tema Deep Matcha Gelap */\
            padding: 7rem 5%;\
            position: relative;\
            overflow: hidden;\
            font-family: '\''Plus Jakarta Sans'\'', sans-serif;\
            border-top: 1px solid rgba(212, 175, 55, 0.1);\
        }\
\
        .haji-bg-glow {\
            position: absolute;\
            top: 50%;\
            left: 50%;\
            transform: translate(-50%, -50%);\
            width: 70%;\
            height: 70%;\
            background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, rgba(16, 38, 24, 0.3) 50%, transparent 80%);\
            filter: blur(60px);\
            z-index: 1;\
            pointer-events: none;\
        }\
\
        .haji-container {\
            position: relative;\
            z-index: 2;\
            max-width: 1200px;\
            margin: 0 auto;\
        }\
\
        /* Header & Tombol Slider */\
        .haji-header-flex {\
            display: flex;\
            justify-content: space-between;\
            align-items: flex-end;\
            margin-bottom: 3.5rem;\
        }\
\
        .haji-title {\
            font-family: '\''Playfair Display'\'', serif;\
            font-size: 2.8rem;\
            color: #ffffff;\
            margin-top: 1rem;\
            line-height: 1.2;\
        }\
\
        .haji-title .gold-text { color: #D4AF37; }\
\
        .haji-desc {\
            color: #a3b8aa;\
            font-size: 1.05rem;\
            max-width: 650px;\
            margin-top: 0.8rem;\
            line-height: 1.6;\
        }\
\
        /* Tombol Navigasi Slider */\
        .slider-nav-buttons {\
            display: flex;\
            gap: 15px;\
        }\
\
        .slider-btn {\
            width: 50px;\
            height: 50px;\
            border-radius: 50%;\
            background: rgba(255, 255, 255, 0.03);\
            border: 1px solid rgba(212, 175, 55, 0.3);\
            color: #D4AF37;\
            font-size: 1.2rem;\
            cursor: pointer;\
            display: flex;\
            justify-content: center;\
            align-items: center;\
            transition: all 0.3s ease;\
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);\
        }\
\
        .slider-btn:hover {\
            background: #D4AF37;\
            color: #050a07;\
            transform: scale(1.05);\
        }\
\
        /* Slider Track */\
        .haji-slider-wrapper {\
            position: relative;\
            width: 100%;\
            overflow: hidden;\
            padding: 10px 0 30px 0;\
        }\
\
        .haji-track {\
            display: flex;\
            gap: 30px;\
            overflow-x: auto;\
            scroll-behavior: smooth;\
            scrollbar-width: none;\
            -ms-overflow-style: none;\
            padding-bottom: 10px;\
        }\
\
        .haji-track::-webkit-scrollbar {\
            display: none;\
        }\
\
        /* Kartu Paket Haji */\
        .package-card {\
            flex: 0 0 360px;\
            background: rgba(255, 255, 255, 0.02);\
            border: 1px solid rgba(255, 255, 255, 0.06);\
            border-radius: 24px;\
            overflow: hidden;\
            transition: all 0.4s ease;\
            backdrop-filter: blur(10px);\
            position: relative;\
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);\
        }\
\
        .package-card:hover {\
            transform: translateY(-8px);\
            border-color: rgba(212, 175, 55, 0.4);\
            background: rgba(212, 175, 55, 0.03);\
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);\
        }\
\
        /* Kartu Unggulan (Furoda) */\
        .featured-card {\
            border-color: rgba(212, 175, 55, 0.5);\
            background: linear-gradient(180deg, rgba(212,175,55,0.06) 0%, rgba(10,23,15,0.95) 100%);\
        }\
\
        .ribbon-fav {\
            position: absolute;\
            top: 20px;\
            right: -40px;\
            background: linear-gradient(45deg, #D4AF37, #AA771C);\
            color: #050a07;\
            padding: 6px 45px;\
            font-size: 0.7rem;\
            font-weight: 800;\
            letter-spacing: 1px;\
            transform: rotate(45deg);\
            box-shadow: 0 5px 10px rgba(0,0,0,0.3);\
            z-index: 3;\
        }\
\
        /* Gambar & Badge */\
        .card-image-box {\
            position: relative;\
            height: 220px;\
            overflow: hidden;\
        }\
\
        .card-image-box img {\
            width: 100%;\
            height: 100%;\
            object-fit: cover;\
            transition: transform 0.6s ease;\
        }\
\
        .package-card:hover .card-image-box img {\
            transform: scale(1.1);\
        }\
\
        .duration-badge {\
            position: absolute;\
            bottom: 15px;\
            right: 15px;\
            background: rgba(5, 10, 7, 0.85);\
            border: 1px solid rgba(212, 175, 55, 0.4);\
            color: #D4AF37;\
            padding: 6px 14px;\
            border-radius: 20px;\
            font-size: 0.85rem;\
            font-weight: bold;\
            backdrop-filter: blur(5px);\
        }\
\
        /* Konten Dalam Kartu */\
        .card-body {\
            padding: 2.5rem 2rem;\
        }\
\
        .package-card h3 {\
            font-family: '\''Playfair Display'\'', serif;\
            color: #ffffff;\
            font-size: 1.5rem;\
            margin-bottom: 0.8rem;\
        }\
\
        .package-price {\
            font-family: '\''Playfair Display'\'', serif;\
            color: #D4AF37;\
            font-size: 1.7rem;\
            font-weight: 700;\
            margin-bottom: 2rem;\
        }\
\
        .package-price .currency {\
            font-size: 0.95rem;\
            vertical-align: super;\
        }\
\
        .package-price .pax {\
            font-family: '\''Plus Jakarta Sans'\'', sans-serif;\
            font-size: 0.85rem;\
            color: #8fa697;\
            font-weight: normal;\
        }\
\
        /* Daftar Fasilitas */\
        .package-features {\
            list-style: none;\
            padding: 0;\
            margin: 0 0 2rem 0;\
            display: flex;\
            flex-direction: column;\
            gap: 12px;\
        }\
\
        .package-features li {\
            color: #c0d1c6;\
            font-size: 0.95rem;\
            display: flex;\
            align-items: center;\
            gap: 10px;\
        }\
\
        .icon-check {\
            color: #D4AF37;\
            font-weight: bold;\
        }\
\
        /* Tombol Kartu */\
        .btn-card-solid {\
            display: block;\
            width: 100%;\
            background: linear-gradient(45deg, #D4AF37, #AA771C);\
            color: #050a07;\
            text-align: center;\
            padding: 14px;\
            border-radius: 12px;\
            font-weight: bold;\
            text-decoration: none;\
            transition: all 0.3s ease;\
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);\
        }\
\
        .btn-card-solid:hover {\
            transform: translateY(-2px);\
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.5);\
        }\
\
        .btn-card-outline {\
            display: block;\
            width: 100%;\
            background: transparent;\
            color: #ffffff;\
            text-align: center;\
            padding: 14px;\
            border-radius: 12px;\
            font-weight: 500;\
            text-decoration: none;\
            border: 1px solid rgba(255, 255, 255, 0.2);\
            transition: all 0.3s ease;\
        }\
\
        .btn-card-outline:hover {\
            border-color: #D4AF37;\
            color: #D4AF37;\
            background: rgba(212, 175, 55, 0.05);\
        }\
\
        /* Responsif Mobile */\
        @media (max-width: 992px) {\
            .haji-header-flex {\
                flex-direction: column;\
                align-items: flex-start;\
                gap: 20px;\
            }\
            .slider-nav-buttons {\
                align-self: flex-end;\
            }\
            .package-card {\
                flex: 0 0 300px;\
            }\
        }\
' src/pages/Home.tsx
