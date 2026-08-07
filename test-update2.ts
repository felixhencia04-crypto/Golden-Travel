import { config } from 'dotenv';
config();
import { db } from './src/db';
import { packages } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
  try {
    const id = "3247aced-854a-463a-a048-23c3602582ad";
    await db.update(packages).set({
      name: "Haji Haji",
      description: '["Oke","Mantap","Sangat Mantap","Luar Biasa"]',
      price: "100000000",
      duration: "12 Hari",
      imageUrl: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80",
      type: "haji",
      isAvailable: true,
      quota: 20,
      manasikPdfUrl: ""
    }).where(eq(packages.id, id));
    console.log("Success");
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    process.exit(0);
  }
}
test();
