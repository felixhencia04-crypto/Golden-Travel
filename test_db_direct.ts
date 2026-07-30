
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './src/db/schema.ts';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function test() {
  const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const host = process.env.SQL_HOST || process.env.PGHOST || process.env.POSTGRES_HOST || '127.0.0.1';
  const port = process.env.SQL_PORT || process.env.PGPORT || process.env.POSTGRES_PORT || '5432';
  const dbName = process.env.SQL_DB_NAME || process.env.PGDATABASE || process.env.POSTGRES_DB;
  const rawDbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL;

  const poolConfig: pg.PoolConfig = {
    connectionString: rawDbUrl || `postgresql://${user}:${password}@${host}:${port}/${dbName}`,
    ssl: rawDbUrl?.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
  };

  const pool = new Pool(poolConfig);
  const db = drizzle(pool, { schema });

  try {
    const workspaces = await db.select().from(schema.workspaces);
    console.log('Workspaces in DB:', JSON.stringify(workspaces, null, 2));
    
    const users = await db.select().from(schema.users);
    console.log('Users in DB:', JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

test();
