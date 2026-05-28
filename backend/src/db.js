import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (see backend/.env).");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params);
