import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const reason = undefined;
    const [updatedPayment] = await db.update(schema.payments)
        .set({ status: 'PENDING', adminNotes: reason })
        .where(eq(schema.payments.id, '495b778c-3318-43e1-a05b-61ffd8a1e488'))
        .returning();
    console.log("Updated:", updatedPayment);
  } catch (e) {
    console.error("ERROR", e.message);
  }
}
main();
