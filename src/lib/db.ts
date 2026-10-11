import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env");
}

// In development, Next.js re-runs modules when you save a file.
// Store the pool on globalThis so each reload reuses it instead of opening new connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const pool = globalForDb.pgPool ?? new Pool({ connectionString, max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}