import fs from 'fs';

const serverFile = 'server.ts';
let code = fs.readFileSync(serverFile, 'utf8');

const oldAuth = `
  // 1. Try Custom JWT first
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.role === 'admin') {
      const ADMIN_ID = '00000000-0000-0000-0000-000000000000';
      let adminUser = await db.query.users.findFirst({
        where: eq(schema.users.id, ADMIN_ID)
      });
      if (!adminUser) {
        const [newAdmin] = await db.insert(schema.users).values({
          id: ADMIN_ID,
          uid: 'admin-hardcoded-uid',
          email: 'admin@goldentravel.local',
          name: 'Administrator',
          role: 'admin',
        }).returning();
        adminUser = newAdmin;
      }
      req.user = adminUser;
      return next();
    }
  } catch (e) {
    // Not a valid custom JWT, fallback to Firebase
  }

  // 2. Try Firebase Auth
  try {
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err: any) {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {
        // Only log if it's NOT the common "no kid claim" error or if we want to be aware of fallbacks
        if (!err.message?.includes('kid')) {
          console.error('verifyIdToken middleware failed:', err.message);
        }
        decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };
      } else {
        console.error('verifyIdToken middleware failed and no fallback possible:', err.message, "decoded:", decoded);
        throw err;
      }
    }
`;

const newAuth = `
  // 1. Try Custom JWT first
  const unverifiedDecoded = jwt.decode(token) as any;
  if (unverifiedDecoded && unverifiedDecoded.role === 'admin') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const ADMIN_ID = '00000000-0000-0000-0000-000000000000';
      let adminUser = await db.query.users.findFirst({
        where: eq(schema.users.id, ADMIN_ID)
      });
      if (!adminUser) {
        const [newAdmin] = await db.insert(schema.users).values({
          id: ADMIN_ID,
          uid: 'admin-hardcoded-uid',
          email: 'admin@goldentravel.local',
          name: 'Administrator',
          role: 'admin',
        }).returning();
        adminUser = newAdmin;
      }
      req.user = adminUser;
      return next();
    } catch (e: any) {
      return res.status(401).json({ error: 'Sesi Admin telah berakhir. Silakan login kembali.' });
    }
  }

  // 2. Try Firebase Auth
  try {
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err: any) {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {
        // Only log if it's NOT the common "no kid claim" error or if we want to be aware of fallbacks
        if (!err.message?.includes('kid')) {
          console.error('verifyIdToken middleware failed:', err.message);
        }
        decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };
      } else {
        console.error('verifyIdToken middleware failed and no fallback possible:', err.message, "decoded:", decoded);
        return res.status(401).json({ error: 'Sesi telah berakhir atau tidak valid. Silakan login kembali.' });
      }
    }
`;

code = code.replace(oldAuth, newAuth);
fs.writeFileSync(serverFile, code);
