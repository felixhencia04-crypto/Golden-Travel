import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/pages/Admin.tsx', 'utf8');

const loadingBlock = `
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-matcha-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Memuat Portal Admin...</p>
        </div>
      </div>
    );
  }
`;

content = content.replace(loadingBlock, '');

const mainReturnIndex = content.indexOf('return (\n    <div className="min-h-screen bg-gray-100');
if (mainReturnIndex !== -1) {
    content = content.slice(0, mainReturnIndex) + loadingBlock + '  ' + content.slice(mainReturnIndex);
    writeFileSync('src/pages/Admin.tsx', content);
    console.log("Patched successfully!");
} else {
    console.log("Could not find main return");
}

