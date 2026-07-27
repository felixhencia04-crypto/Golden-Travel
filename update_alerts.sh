sed -i '1964,2003c\
              {/* Smart Alerts */}\
              {alerts.length > 0 && (\
                <section className="portal-alert-section">\
                    <div className="alert-header-area">\
                        <div className="alert-pulse-icon">!</div>\
                        <h2 className="alert-section-title">Tindakan Diperlukan</h2>\
                    </div>\
\
                    <div className="alert-grid">\
                        {alerts.map(alert => {\
                            const cardClass = alert.type === '\''error'\'' ? '\''alert-critical'\'' : alert.type === '\''warning'\'' ? '\''alert-warning'\'' : '\''alert-info'\'';\
                            const icon = alert.type === '\''error'\'' ? '\''⚠️'\'' : alert.type === '\''warning'\'' ? '\''💰'\'' : '\''📄'\'';\
\
                            return (\
                                <div key={alert.id} className={`alert-card ${cardClass}`}>\
                                    <div className="alert-icon-box">\
                                        <span className="icon">{icon}</span>\
                                    </div>\
                                    <div className="alert-content">\
                                        <h3>{alert.title}</h3>\
                                        <p>{alert.desc}</p>\
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
                                    </div>\
                                </div>\
                            );\
                        })}\
                    </div>\
                </section>\
              )}\
' src/pages/DashboardJamaah.tsx
