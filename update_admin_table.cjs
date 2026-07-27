const fs = require('fs');

const file = 'src/pages/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<td className="py-4 px-4 text-right">\s*<select/g;
const replacement = `<td className="py-4 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedJamaah(cons);
                                  setIsJamaahDetailsModalOpen(true);
                                }}
                                className="mr-3 px-3 py-1 bg-matcha-100 text-matcha-700 rounded hover:bg-matcha-200 transition text-xs font-medium"
                              >
                                Detail
                              </button>
                              <select`;

content = content.replace(regex, replacement);

// Let's add verification buttons inside the modal too if not present.
fs.writeFileSync(file, content, 'utf8');
