import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.SQL_HOST || process.env.PGHOST || '127.0.0.1',
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : (process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432),
        user: process.env.SQL_ADMIN_USER || process.env.SQL_USER || process.env.PGUSER || process.env.POSTGRES_USER!,
        password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD!,
        database: process.env.SQL_DB_NAME || process.env.PGDATABASE || process.env.POSTGRES_DB!,
        ssl: false,
      },
});
