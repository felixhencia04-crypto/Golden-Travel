import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('server.ts', 'utf8');

// Add jwt import
if (!content.includes('import jwt')) {
  content = content.replace('import cors from "cors";', 'import cors from "cors";\nimport jwt from "jsonwebtoken";');
}

// Modify authenticate
const oldAuth = `
async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.uid, decodedToken.uid),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
`;

const newAuth = `
const JWT_SECRET = process.env.JWT_SECRET || 'golden-travel-super-secret-key-2026';

async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // 1. Try Custom JWT first
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.role === 'admin') {
      req.user = {
        id: 'admin-hardcoded-id',
        uid: 'admin-uid',
        email: 'admin@goldentravel.local',
        name: 'Administrator',
        role: 'admin',
        phone: null,
        mitraId: null,
        referralCode: null,
        createdAt: new Date(),
        workspaceId: null
      } as any;
      return next();
    }
  } catch (e) {
    // Not a valid custom JWT, fallback to Firebase
  }

  // 2. Try Firebase Auth
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.uid, decodedToken.uid),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
`;

content = content.replace(oldAuth.trim(), newAuth.trim());

// Add POST /api/admin/login route inside startServer
const oldStartServer = `
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: !!db });
  });
`;

const newStartServer = `
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: !!db });
  });

  // Custom Admin Login (Password Only)
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    // Password is hardcoded here. User will use this to login.
    if (password === 'admin123') {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, role: 'admin' });
    } else {
      res.status(401).json({ error: 'Kata sandi salah' });
    }
  });
`;

if (!content.includes('/api/admin/login')) {
  content = content.replace(oldStartServer.trim(), newStartServer.trim());
}

writeFileSync('server.ts', content);
