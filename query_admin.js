import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Client } = pkg;
import { users } from './src/db/schema.ts'; // Oops, typescript
