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
  const schemaUrl = new URL("../db/schema.sql", import.meta.url);
  const schema = await readFile(schemaUrl, "utf8");
  await client.query(schema);
  console.log("Schema applied.");
} finally {
  await client.end();
}