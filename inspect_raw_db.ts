import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function run() {
  const result = await db.execute(sql`SELECT id, user_id, package_id, orderer_name, pax_data FROM registrations;`);
  console.log("SQL Result length:", result.rows.length);
  for (const row of result.rows) {
    console.log(`ID: ${row.id}, Orderer: ${row.orderer_name}, Pax Count: ${Array.isArray(row.pax_data) ? row.pax_data.length : 'not array'}`);
    if (Array.isArray(row.pax_data)) {
      console.log('Pax items:', row.pax_data.map((p: any) => p?.fullName || p?.name || p?.userName));
    }
  }
}

run().then(() => process.exit(0));
