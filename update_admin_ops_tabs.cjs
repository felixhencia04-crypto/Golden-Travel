const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const tabRegex = /const \[activeOpsTab, setActiveOpsTab\] = useState<'inventory' \| 'broadcast' \| 'manifest'>\('inventory'\);/;
const newTabState = `const [activeOpsTab, setActiveOpsTab] = useState<'inventory' | 'broadcast' | 'manifest' | 'dokumen_final'>('inventory');`;
code = code.replace(tabRegex, newTabState);

const buttonsRegex = /<button \n\s*onClick=\{\(\) => setActiveOpsTab\('manifest'\)\}[\s\S]*?<\/button>\n\s*<\/div>/;
const newButtons = `<button 
                    onClick={() => setActiveOpsTab('manifest')}
                    className={\`px-6 py-2 rounded-xl text-sm font-bold transition-all \${activeOpsTab === 'manifest' ? 'bg-white shadow-md text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'}\`}
                  >
                    Manifes
                  </button>
                  <button 
                    onClick={() => setActiveOpsTab('dokumen_final')}
                    className={\`px-6 py-2 rounded-xl text-sm font-bold transition-all \${activeOpsTab === 'dokumen_final' ? 'bg-white shadow-md text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'}\`}
                  >
                    Dokumen Final
                  </button>
                </div>`;
code = code.replace(buttonsRegex, newButtons);

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Admin tabs updated");
