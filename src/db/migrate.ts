import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

dotenv.config();


function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const runMigration = async () => {
  console.log('🚀 Memulai proses migrasi ke database...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('⚠️ NOTICE: DATABASE_URL tidak ditemukan di environment variables. Melewati migrasi standalone.');
    return;
  }

  console.log('🔗 Mencoba terhubung ke database menggunakan SSL (rejectUnauthorized: false)...');

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('⏳ Sedang mengeksekusi sinkronisasi skema (migrate)...');
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrasi database berhasil diselesaikan tanpa error!');

    console.log("⏳ Memeriksa apakah tabel users kosong...");
    const userCount = await db.select({ count: sql`count(*)` }).from(schema.users);
    if (Number(userCount[0].count) === 0) {
      console.log("Tabel users kosong. Membuat admin default...");
      let ws: any = await db.query.workspaces.findFirst();
      if (!ws) {
        console.log("Workspace belum ada. Membuat workspace default...");
        const newWs = await db.insert(schema.workspaces).values({
          name: "Golden Travel Workspace",
          slug: "golden-travel"
        }).returning();
        ws = newWs[0];
      }
      
      await db.insert(schema.users).values({
        workspaceId: ws.id,
        uid: crypto.randomUUID(),
        name: 'Super Admin',
        email: 'admin@goldentravel.id',
        password: hashPassword('admin123'),
        role: 'admin',
        status: 'active'
      });
      console.log("✅ Akun admin default berhasil dibuat!");
    } else {
      console.log("✅ Tabel users sudah berisi data. Melewati seeding admin.");
    }
    
  } catch (error) {
    console.error('❌ GAGAL: Terjadi kesalahan saat menjalankan migrasi atau seeder:', error);
  } finally {
    console.log('🔌 Menutup koneksi database...');
    await pool.end();
  }
};

runMigration();
