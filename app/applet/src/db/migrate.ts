import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const runMigration = async () => {
  console.log('🚀 Memulai proses migrasi ke database...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL tidak ditemukan di environment variables.');
    process.exit(1);
  }

  console.log('🔗 Mencoba terhubung ke database menggunakan SSL (rejectUnauthorized: false)...');

  // Konfigurasi Pool dengan SSL eksplisit untuk environment production / Railway
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(pool);

  try {
    console.log('⏳ Sedang mengeksekusi sinkronisasi migrasi skema...');
    
    // Pastikan path ke folder drizzle (hasil generate) benar
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrasi database berhasil diselesaikan tanpa error!');
    
  } catch (error) {
    console.error('❌ GAGAL: Terjadi kesalahan saat menjalankan migrasi:', error);
  } finally {
    console.log('🔌 Menutup koneksi database...');
    await pool.end();
  }
};

runMigration();
