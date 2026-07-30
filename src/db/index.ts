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
    const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || process.env.PGUSER || process.env.POSTGRES_USER;
    const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
    const host = process.env.SQL_HOST || process.env.PGHOST || process.env.POSTGRES_HOST || '127.0.0.1';
    const port = process.env.SQL_PORT || process.env.PGPORT || process.env.POSTGRES_PORT || '5432';
    const dbName = process.env.SQL_DB_NAME || process.env.PGDATABASE || process.env.POSTGRES_DB;

    const rawDbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL;

    console.log(`[DB Pool] Initializing pool: host=${host}, port=${port}, user=${user}, db=${dbName}, DATABASE_URL=${rawDbUrl ? 'SET' : 'UNSET'}`);
    
    const poolConfig: pg.PoolConfig = {
      max: 15,
      min: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 2000, // Drop idle connections after 2s to prevent dead socket errors
      maxUses: 100, // Recycle connection after 100 queries
    };

    const isPlaceholderUrl = rawDbUrl && (
      rawDbUrl.includes('user:password@host:port') ||
      rawDbUrl.includes('user:password@') ||
      rawDbUrl.includes('@host:port')
    );

    if (rawDbUrl && !isPlaceholderUrl) {
      console.log(`[DB Pool] Using DATABASE_URL connection string`);
      poolConfig.connectionString = rawDbUrl;
      
      const disableSSL = rawDbUrl.includes('sslmode=disable') || rawDbUrl.includes('ssl=false');
      const forceSSL = rawDbUrl.includes('sslmode=require') || rawDbUrl.includes('ssl=true');
      
      if (forceSSL && !disableSSL) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
    } else {
      if (isPlaceholderUrl) {
        console.warn(`[DB Pool Warning] DATABASE_URL is set to a template placeholder ('${rawDbUrl}'). Falling back to individual host/user/password variables.`);
      }
      poolConfig.host = host;
      poolConfig.port = parseInt(port, 10);
      poolConfig.user = user;
      poolConfig.password = password;
      poolConfig.database = dbName;

      const enableSSL = process.env.SQL_SSL === 'true' || 
                       process.env.PGSSLMODE === 'require' || 
                       process.env.DB_SSL === 'true';
      if (enableSSL) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
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
