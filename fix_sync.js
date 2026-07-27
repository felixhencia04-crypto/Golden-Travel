import fs from 'fs';

const serverFile = 'server.ts';
let code = fs.readFileSync(serverFile, 'utf8');

const oldSync = `
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (err: any) {
        // Fallback for mock tokens (e.g. from AI Studio / Emulator)
        const decoded = jwt.decode(idToken) as any;
        if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {
          if (!err.message?.includes('kid')) {
            console.error('verifyIdToken failed in /sync:', err.message);
          }
          decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };
        } else {
          console.error('verifyIdToken failed in /sync and no fallback possible:', err.message, "decoded:", decoded);
          throw err;
        }
      }
`;

const newSync = `
      let decodedToken;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (err: any) {
        // Fallback for mock tokens (e.g. from AI Studio / Emulator)
        const decoded = jwt.decode(idToken) as any;
        if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {
          if (!err.message?.includes('kid')) {
            console.error('verifyIdToken failed in /sync:', err.message);
          }
          decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };
        } else {
          console.error('verifyIdToken failed in /sync and no fallback possible:', err.message, "decoded:", decoded);
          return res.status(401).json({ error: 'Sesi telah berakhir atau tidak valid. Silakan login kembali.' });
        }
      }
`;

code = code.replace(oldSync, newSync);
fs.writeFileSync(serverFile, code);
