sed -i '1979,2021c\
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
' src/pages/DashboardJamaah.tsx
