const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldEnsure = `async function ensureTableAndColumns() {
    console.log('[DB Migration] Schema is managed via Drizzle. Skipping manual verification.');
    return;
  }`;

const newEnsure = `async function ensureTableAndColumns() {
    console.log('[DB Schema] Ensuring core tables exist...');
    try {
      await db.execute(sql\`
        CREATE TABLE IF NOT EXISTS "workspaces" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" text NOT NULL,
          "slug" text UNIQUE NOT NULL,
          "domain" text UNIQUE,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      \`);
      await db.execute(sql\`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "workspace_id" uuid,
          "uid" text UNIQUE,
          "email" text NOT NULL,
          "name" text NOT NULL,
          "phone" text,
          "avatar_url" text,
          "role" text DEFAULT 'jamaah' NOT NULL,
          "status" text DEFAULT 'active' NOT NULL,
          "mitra_id" uuid,
          "referral_code" text UNIQUE,
          "password" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          "deleted_at" timestamp
        );
      \`);
      console.log('[DB Schema] Core tables (workspaces, users) verified/created.');
    } catch (e) {
      console.warn('[DB Schema] Error ensuring tables:', e?.message || e);
    }
  }`;

if (code.includes(oldEnsure)) {
  code = code.replace(oldEnsure, newEnsure);
  console.log("Successfully updated ensureTableAndColumns!");
} else {
  code = code.replace(/async function ensureTableAndColumns\(\)[\s\S]*?\n  \}/, newEnsure);
  console.log("Updated ensureTableAndColumns via regex!");
}

fs.writeFileSync('server.ts', code);
