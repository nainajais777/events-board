import { readFile } from "node:fs/promises";
import pg from "pg";
import bcrypt from "bcryptjs";
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
    const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@events.test").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await client.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')",
    [adminEmail, adminHash]
  );
  console.log(`Admin user created: ${adminEmail}`);
} finally {
  await client.end();
}