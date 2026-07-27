import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    try {
        const sqlConfig = JSON.parse(readFileSync('./cloudsql-config.json', 'utf8'));
        // Cloud SQL config mapping if possible, but let's just see if we can use the cloudsql tool
    } catch (e) {}
}

