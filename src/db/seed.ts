import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

async function seed() {
  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_ADMIN_PASSWORD;

  if (!sqlHost || !sqlDbName || !user || !password) {
    console.error('SQL environment variables are required for seeding');
    process.exit(1);
  }

  const pool = new Pool({
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  });
  const db = drizzle(pool, { schema });

  console.log('Seeding initial packages...');

  const initialPackages = [
    {
      name: 'Paket Umroh Reguler 9 Hari',
      description: 'Paket umroh ekonomis dengan hotel bintang 3 di Mekkah dan Madinah.',
      price: '28500000',
      duration: '9 Hari',
      imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Paket Umroh Plus Turki 12 Hari',
      description: 'Nikmati perjalanan spiritual umroh sekaligus wisata sejarah ke Turki.',
      price: '35000000',
      duration: '12 Hari',
      imageUrl: 'https://images.unsplash.com/photo-1541432901912-a39cabbef40c?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Paket Umroh VIP Bintang 5',
      description: 'Akomodasi hotel bintang 5 persis di depan Masjidil Haram dan Nabawi.',
      price: '42000000',
      duration: '9 Hari',
      imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  for (const pkg of initialPackages) {
    await db.insert(schema.packages).values(pkg);
  }

  console.log('Seed completed!');
  await pool.end();
}

seed().catch(console.error);
