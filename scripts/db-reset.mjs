import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  for (const file of ["schema.sql", "seed.sql"]) {
    const sql = await readFile(new URL(`../db/${file}`, import.meta.url), "utf8");
    await client.query(sql);
    console.log(`Applied ${file}`);
  }
} finally {
  await client.end();
}