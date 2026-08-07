import { config } from 'dotenv';
config();
import { db } from './src/db';
import { users, registrations, payments, documents, packages } from './src/db/schema';
import { eq, and, ne, gte, sql } from 'drizzle-orm';

async function test() {
  const req = { user: { workspaceId: '206247ec-7f3b-4e74-8dc6-b109372dbbef' } };
  try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Jamaah Aktif
      const allJamaahUsers = await db.select({
        id: users.id
      })
      .from(users)
      .where(and(
        eq(users.workspaceId, req.user!.workspaceId!),
        eq(users.role, 'jamaah'),
        ne(users.status, 'suspended')
      ));
      
      const totalJamaah = allJamaahUsers.length;
      
      console.log({ totalJamaah });
  } catch (error) {
      console.error(error);
  }
  process.exit(0);
}
test();
