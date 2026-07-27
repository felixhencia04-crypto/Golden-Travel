sed -i '1976,2022c\
              {/* Smart Alerts */}\
              {alerts.length > 0 && (\
                <section className="portal-alert-section">\
                    <div className="alert-header-area">\
                        <div className="alert-pulse-icon">!</div>\
                        <h2 className="alert-section-title">Status Kelengkapan Data</h2>\
                    </div>\
\
                    <div className="alert-grid">\
                        {alerts.map(alert => {\
                            let cardClass = "";\
                            let icon = "";\
                            if (alert.completed) {\
                                cardClass = '\''alert-success'\'';\
                                icon = '\''✅'\'';\
                            } else {\
                                cardClass = alert.type === '\''error'\'' ? '\''alert-critical'\'' : alert.type === '\''warning'\'' ? '\''alert-warning'\'' : '\''alert-info'\'';\
                                icon = alert.type === '\''error'\'' ? '\''⚠️'\'' : alert.type === '\''warning'\'' ? '\''💰'\'' : '\''📄'\'';\
                            }\
\
                            return (\
                                <div key={alert.id} className={`alert-card ${cardClass} ${alert.completed ? '\''completed-card'\'' : '\''\''}`}>\
                                    <div className="alert-icon-box">\
                                        <span className="icon">{icon}</span>\
                                    </div>\
                                    <div className="alert-content">\
                                        <h3>{alert.title}</h3>\
                                        <p>{alert.desc}</p>\
                                        {!alert.completed && (\
                                            <button \
                                                onClick={() => {\
                                                    if (alert.id === '\''biodata'\'') setActiveTab('\''biodata'\'');\
                                                    else if (alert.id === '\''pay'\'' || alert.id === '\''pay2'\'') setActiveTab('\''pembayaran'\'');\
                                                    else if (alert.id === '\''docs'\'') setActiveTab('\''dokumen'\'');\
                                                }}\
                                                className="alert-action-btn"\
                                            >\
                                                Selesaikan Sekarang <span>→</span>\
                                            </button>\
                                        )}\
                                    </div>\
                                </div>\
                            );\
                        })}\
                    </div>\
                </section>\
              )}\
\
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">\
                {/* Left Column: Progress & Status */}\
                <div className="lg:col-span-2 space-y-8">\
                  {/* Status Cards */}\
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">\
                    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm flex items-center group hover:border-gray-200 transition-all">\
                      <div className="w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center mr-5 shrink-0 group-hover:scale-110 transition-transform">\
' src/pages/DashboardJamaah.tsx
