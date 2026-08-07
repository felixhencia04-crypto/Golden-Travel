import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

declare global {
  var _postgresPool: pg.Pool | undefined;
  var _drizzleDb: any | undefined;
}

// Global process handlers are removed to allow fatal errors (like EADDRINUSE) to correctly terminate the process,
// enabling the environment to restart the container or the dev server correctly.

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
      max: 15, // Safe pool size for container environment to prevent Postgres max_connections error
      min: 2,  
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000, 
      maxUses: 5000, 
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
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

    global._postgresPool.on('connect', () => {
      // Client connected
    });

    global._postgresPool.on('remove', () => {
      // Client removed
    });

    global._postgresPool.on('error', (err: any) => {
      if (err.message?.includes('terminated unexpectedly') || err.message?.includes('closed') || err.code === 'ECONNRESET') {
        console.warn(`[DB Pool Warning] Transient connection issue handled: ${err.message}`);
      } else {
        console.warn('[DB Pool Warning] Handled idle client error:', err.message);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();

if (!global._drizzleDb) {
  global._drizzleDb = drizzle(pool, { schema });
}

export const db: any = global._drizzleDb;

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
