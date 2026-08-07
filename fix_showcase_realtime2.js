import fs from 'fs';

function addRealtime(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes("BroadcastChannel")) {
    const target = 'fetchPackages();\n  }, []);';
    const replaceWith = `fetchPackages();
    
    try {
      const channel = new BroadcastChannel('golden_travel_updates');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CATALOG_UPDATED') {
          fetchPackages();
        }
      };
      return () => channel.close();
    } catch(e) {}
  }, []);`;
    if (code.includes(target)) {
      code = code.replace(target, replaceWith);
      fs.writeFileSync(file, code);
      console.log(`Success ${file}`);
    } else {
      console.log(`Target not found in ${file}`);
    }
  }
}

addRealtime('src/components/PaketUmrahShowcase.tsx');
addRealtime('src/components/PaketHajiShowcase.tsx');
