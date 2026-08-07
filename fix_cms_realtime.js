import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const importRegex = /import React, \{ useState, useEffect \} from 'react';/;
if (!code.includes("notifyRealtimeCatalogChange")) {
  const insertIndex = code.indexOf('export default function CMSManager');
  const notifyFn = `
const notifyRealtimeCatalogChange = () => {
  try {
    const channel = new BroadcastChannel('golden_travel_updates');
    channel.postMessage({ type: 'CATALOG_UPDATED', timestamp: Date.now() });
    channel.close();
  } catch (e) {
    console.error('BroadcastChannel failed', e);
  }
};
`;
  code = code.slice(0, insertIndex) + notifyFn + code.slice(insertIndex);
  
  // Now add to onSuccess where packages are created/updated/deleted
  code = code.replace(/toast\.success\('Paket berhasil diperbarui'\);/g, "toast.success('Paket berhasil diperbarui');\n        notifyRealtimeCatalogChange();");
  code = code.replace(/toast\.success\('Paket baru berhasil ditambahkan'\);/g, "toast.success('Paket baru berhasil ditambahkan');\n        notifyRealtimeCatalogChange();");
  code = code.replace(/toast\.success\('Paket berhasil dihapus'\);/g, "toast.success('Paket berhasil dihapus');\n        notifyRealtimeCatalogChange();");
  code = code.replace(/toast\.success\('Status paket diperbarui'\);/g, "toast.success('Status paket diperbarui');\n      notifyRealtimeCatalogChange();");
  
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success realtime added to CMSManager");
}
