import fs from 'fs';

function addRealtime(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes("BroadcastChannel")) {
    const fetchCallRegex = /fetchPackages\(\);/;
    // We can just add a useEffect right after fetchPackages is defined, or just inside the existing useEffect.
    // Let's find the useEffect that calls fetchPackages();
    const useEffectRegex = /useEffect\(\(\) => \{\s*fetchPackages\(\);\s*\}, \[\]\);/;
    
    const newUseEffect = `useEffect(() => {
    fetchPackages();
    
    try {
      const channel = new BroadcastChannel('golden_travel_updates');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CATALOG_UPDATED') {
          console.log('Realtime catalog update received');
          fetchPackages();
        }
      };
      return () => {
        channel.close();
      };
    } catch(e) {}
  }, []);`;

    if (useEffectRegex.test(code)) {
      code = code.replace(useEffectRegex, newUseEffect);
      fs.writeFileSync(file, code);
      console.log(`Success ${file}`);
    } else {
      console.log(`Regex not found ${file}`);
    }
  }
}

addRealtime('src/components/PaketUmrahShowcase.tsx');
addRealtime('src/components/PaketHajiShowcase.tsx');
