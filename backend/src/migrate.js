import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const schema = readFileSync(join(here, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("✔ schema applied");

  // Seed a known account so login works out-of-the-box and matches the mock
  // dashboard client (Sarah Holden). Idempotent.
  const email = "client@test.com";
  const { rowCount } = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (rowCount === 0) {
    const hash = await bcrypt.hash("Password1", 12);
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, dob, client_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, hash, "Sarah Holden", "07123 456 7890", "1985-04-12", "RR-676687-554"],
    );
    console.log(`✔ seeded test user ${email} / Password1`);
  } else {
    console.log("• test user already present");
  }

  await pool.end();
  console.log("✔ migration complete");
}

migrate().catch((err) => {
  console.error("migration failed:", err);
  process.exit(1);
});
