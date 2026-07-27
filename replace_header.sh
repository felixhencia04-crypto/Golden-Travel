sed -i '727,744c\
        {/* Portal Topbar / Header (Responsive) */}\
        <header className="portal-topbar">\
            <div className="topbar-left">\
                {/* Tombol Menu / Hamburger */}\
                <button \
                  className="menu-toggle-btn" \
                  aria-label="Toggle Menu"\
                  onClick={() => {\
                    if (window.innerWidth < 1024) {\
                      setIsSidebarOpen(!isSidebarOpen);\
                    } else {\
                      setIsCollapsed(!isCollapsed);\
                    }\
                  }}\
                >\
                    <Menu className="w-5 h-5" />\
                </button>\
                {/* Judul Halaman Dinamis */}\
                <h1 className="page-title">{allMenuItems.find(m => m.id === activeTab)?.label}</h1>\
            </div>\
            \
            <div className="topbar-right">\
                <div className="user-greeting-box">\
                    <span className="user-greeting">Selamat Datang, {userConsultation?.name?.split('\'' '\'')[0] || '\''Jamaah'\''}</span>\
                </div>\
                {/* Tombol Notifikasi */}\
                <button className="notification-btn" aria-label="Notifikasi">\
                    <Bell className="w-5 h-5" />\
                    <span className="notif-badge"></span>\
                </button>\
            </div>\
        </header>\
' src/pages/DashboardJamaah.tsx
