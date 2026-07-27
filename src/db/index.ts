import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

declare global {
  var _postgresPool: pg.Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
    const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;
    const host = process.env.SQL_HOST || process.env.PGHOST || '127.0.0.1';
    const port = process.env.SQL_PORT || process.env.PGPORT || '5432';
    const dbName = process.env.SQL_DB_NAME || process.env.PGDATABASE;

    console.log(`[DB Pool] Initializing pool: host=${host}, port=${port}, user=${user}, db=${dbName}, DATABASE_URL=${process.env.DATABASE_URL ? 'SET' : 'UNSET'}`);
    console.log(`[DB Pool] Available SQL Env Vars:`, Object.keys(process.env).filter(k => k.startsWith('SQL') || k.startsWith('PG') || k.includes('DB') || k.includes('DATABASE')));
    
    const poolConfig: pg.PoolConfig = {
      max: 20,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    };

    const rawDbUrl = process.env.DATABASE_URL;
    const isPlaceholderUrl = rawDbUrl && (
      rawDbUrl.includes('user:password@host:port') ||
      rawDbUrl.includes('user:password@') ||
      rawDbUrl.includes('@host:port')
    );

    if (rawDbUrl && !isPlaceholderUrl) {
      console.log(`[DB Pool] Using DATABASE_URL`);
      poolConfig.connectionString = rawDbUrl;
      
      const needsSSL = rawDbUrl.includes('railway.app') || 
                       rawDbUrl.includes('sslmode=require') ||
                       (!rawDbUrl.includes('localhost') && !rawDbUrl.includes('127.0.0.1'));
      
      if (needsSSL) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
    } else {
      if (isPlaceholderUrl) {
        console.warn(`[DB Pool Warning] DATABASE_URL is set to a template placeholder ('${rawDbUrl}'). Falling back to individual host/user/password variables.`);
      }
      poolConfig.host = host;
      poolConfig.port = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432;
      poolConfig.user = user;
      poolConfig.password = password;
      poolConfig.database = process.env.SQL_DB_NAME;
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err: any) => {
      // Log as warning if it's a common transient connection issue
      if (err.message?.includes('terminated unexpectedly') || err.message?.includes('closed') || err.code === 'ECONNRESET') {
        console.warn(`[DB Pool Warning] Transient idle connection issue: ${err.message}`);
      } else {
        console.error('Unexpected error on idle SQL pool client:', err.message);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });

export async function dbQueryWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isConnErr = err?.message?.includes('Connection terminated') ||
                        err?.message?.includes('closed') ||
                        err?.code === 'ECONNRESET' ||
                        err?.code === '57P01';
      if (attempt < retries && isConnErr) {
        console.warn(`[DB Retry] Retrying query after connection error (attempt ${attempt}/${retries}):`, err.message);
        await new Promise(r => setTimeout(r, 200 * attempt));
      } else {
        throw err;
      }
    }
  }
}
