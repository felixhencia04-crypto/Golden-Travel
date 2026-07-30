import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const payment = await db.query.payments.findFirst({
        where: eq(schema.payments.id, '495b778c-3318-43e1-a05b-61ffd8a1e488')
    });
    console.log("Current Payment:", payment);
    
    // Simulate what the backend does
    const [updatedPayment] = await db.update(schema.payments)
        .set({ status: 'VERIFIED', adminNotes: null })
        .where(eq(schema.payments.id, '495b778c-3318-43e1-a05b-61ffd8a1e488'))
        .returning();
    console.log("Updated:", updatedPayment);
  } catch (e) {
    console.error(e);
  }
}
main();
