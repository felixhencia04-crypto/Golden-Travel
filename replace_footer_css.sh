sed -i '1295,1455c\
        /* --- EXECUTIVE FOOTER SECTION --- */\
        .mitra-footer {\
            background-color: #040906; /* Latar belakang Matcha paling gelap dan pekat */\
            color: #a3b8aa;\
            padding: 5rem 5% 2rem;\
            font-family: '\''Inter'\'', sans-serif;\
            border-top: 1px solid rgba(212, 175, 55, 0.2);\
        }\
\
        .footer-container {\
            max-width: 1200px;\
            margin: 0 auto;\
        }\
\
        /* Grid 4 Kolom Simetris */\
        .footer-grid {\
            display: grid;\
            grid-template-columns: 1.2fr 0.8fr 0.9fr 1.1fr;\
            gap: 40px;\
            margin-bottom: 4rem;\
        }\
\
        /* Logo & Brand Area */\
        .footer-logo-area {\
            display: flex;\
            align-items: center;\
            gap: 12px;\
            margin-bottom: 1.2rem;\
        }\
\
        .footer-logo-icon {\
            font-size: 2rem;\
            background: rgba(212, 175, 55, 0.1);\
            border: 1px solid rgba(212, 175, 55, 0.3);\
            padding: 8px 12px;\
            border-radius: 12px;\
        }\
\
        .footer-brand-text h3 {\
            font-family: '\''Playfair Display'\'', serif;\
            color: #ffffff;\
            font-size: 1.3rem;\
            margin: 0;\
        }\
\
        .footer-brand-text span {\
            font-size: 0.75rem;\
            color: #D4AF37;\
            letter-spacing: 1.5px;\
            font-weight: 700;\
        }\
\
        .footer-desc {\
            font-size: 0.9rem;\
            line-height: 1.6;\
            color: #8fa697;\
            margin-bottom: 1.5rem;\
        }\
\
        /* Kotak Legalitas */\
        .footer-legal-box {\
            background: rgba(255, 255, 255, 0.02);\
            border: 1px solid rgba(255, 255, 255, 0.05);\
            padding: 12px 15px;\
            border-radius: 12px;\
            font-size: 0.8rem;\
            line-height: 1.5;\
            margin-bottom: 1.5rem;\
        }\
\
        .footer-legal-box strong {\
            color: #ffffff;\
            display: block;\
        }\
\
        .footer-legal-box span {\
            color: #a3b8aa;\
            display: block;\
        }\
\
        .footer-legal-box .licence {\
            color: #D4AF37;\
            margin-top: 4px;\
            font-family: monospace;\
        }\
\
        /* Sosial Media Icons */\
        .footer-socials {\
            display: flex;\
            gap: 10px;\
        }\
\
        .social-icon {\
            width: 38px;\
            height: 38px;\
            background: rgba(255, 255, 255, 0.03);\
            border: 1px solid rgba(212, 175, 55, 0.2);\
            border-radius: 50%;\
            display: flex;\
            justify-content: center;\
            align-items: center;\
            text-decoration: none;\
            font-size: 0.9rem;\
            transition: all 0.3s ease;\
        }\
\
        .social-icon:hover {\
            background: #D4AF37;\
            border-color: #D4AF37;\
            transform: translateY(-3px);\
        }\
\
        /* Heading Kolom */\
        .footer-col h4 {\
            font-family: '\''Playfair Display'\'', serif;\
            color: #D4AF37;\
            font-size: 1.15rem;\
            margin-bottom: 1.5rem;\
            letter-spacing: 0.5px;\
            border-bottom: 1px solid rgba(212, 175, 55, 0.15);\
            padding-bottom: 8px;\
        }\
\
        .footer-col .sub-heading {\
            margin-top: 2rem;\
        }\
\
        /* Tautan Link */\
        .footer-links {\
            list-style: none;\
            padding: 0;\
            margin: 0;\
            display: flex;\
            flex-direction: column;\
            gap: 10px;\
        }\
\
        .footer-links li a {\
            color: #a3b8aa;\
            text-decoration: none;\
            font-size: 0.9rem;\
            transition: all 0.3s ease;\
        }\
\
        .footer-links li a:hover {\
            color: #D4AF37;\
            padding-left: 5px; /* Efek geser kecil saat di-hover */\
        }\
\
        /* Kontak Informasi List */\
        .contact-info-list {\
            display: flex;\
            flex-direction: column;\
            gap: 15px;\
        }\
\
        .contact-item {\
            display: flex;\
            align-items: flex-start;\
            gap: 12px;\
            font-size: 0.9rem;\
            line-height: 1.5;\
        }\
\
        .contact-icon {\
            font-size: 1rem;\
            flex-shrink: 0;\
            margin-top: 2px;\
        }\
\
        .contact-item p {\
            margin: 0;\
            color: #c0d1c6;\
        }\
\
        .contact-item .note {\
            color: #8fa697;\
            font-size: 0.8rem;\
        }\
\
        /* Copyright Bar Bawah */\
        .footer-bottom {\
            border-top: 1px solid rgba(255, 255, 255, 0.05);\
            padding-top: 2rem;\
            text-align: center;\
            font-size: 0.85rem;\
            color: #7b8e83;\
        }\
\
        /* Responsif Mobile */\
        @media (max-width: 992px) {\
            .footer-grid {\
                grid-template-columns: 1fr 1fr;\
                gap: 30px;\
            }\
        }\
        @media (max-width: 600px) {\
            .footer-grid {\
                grid-template-columns: 1fr;\
                gap: 30px;\
            }\
        }\
      `}} />\
      <header className="header">\
          <div className="logo">\
              <div className="logo-img"></div>\
              <div className="logo-text">\
' src/pages/Home.tsx
