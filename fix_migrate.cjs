const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Add import
if (!code.includes("drizzle-orm/node-postgres/migrator")) {
    code = `import { migrate } from 'drizzle-orm/node-postgres/migrator';\n` + code;
}

const replacement = `
    try {
      console.log("Menjalankan migrasi Drizzle secara programatis...");
      await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
      console.log("Migrasi database berhasil.");

      // Seeding Admin
      console.log("Memeriksa apakah tabel users kosong...");
      const userCount = await db.select({ count: sql\`count(*)\` }).from(schema.users);
      if (Number(userCount[0].count) === 0) {
        console.log("Tabel users kosong. Membuat admin default...");
        let ws = await db.query.workspaces.findFirst();
        if (!ws) {
          console.log("Workspace belum ada. Membuat workspace default...");
          const newWs = await db.insert(schema.workspaces).values({
            name: "Golden Travel Workspace"
          }).returning();
          ws = newWs[0];
        }
        
        await db.insert(schema.users).values({
          workspaceId: ws.id,
          uid: crypto.randomUUID(),
          name: 'Super Admin',
          email: 'admin@goldentravel.id',
          password: 'admin123',
          role: 'admin',
          status: 'active'
        });
        console.log("Akun admin default (admin@goldentravel.id / admin123) berhasil dibuat!");
      } else {
        console.log("Tabel users sudah berisi data. Melewati seeding admin.");
      }
    } catch (err) {
      console.error("Gagal menjalankan migrasi / seeder:", err);
    }
`;

code = code.replace('// DDL dihapus: Migrasi akan dilakukan via npm run db:push', replacement);

fs.writeFileSync('server.ts', code);
