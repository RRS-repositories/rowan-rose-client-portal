/**
 * Read-only connection to the live CRM database (shared RDS, `public` schema).
 *
 * Separate pool from the portal DB (db.js). Uses CRM_DATABASE_URL, which points
 * at the locked-down `portal_ro` role: SELECT-only on a fixed set of tables, with
 * default_transaction_read_only = on. The portal physically cannot write to the
 * CRM. If CRM_DATABASE_URL is unset, the CRM layer is simply disabled and the
 * client endpoints return empty (no crash) — useful in local/dev.
 */
import pg from "pg";

const { Pool } = pg;
let crmPool = null;

export const crmEnabled = () => Boolean(process.env.CRM_DATABASE_URL);

function getPool() {
  if (!crmEnabled()) return null;
  if (!crmPool) {
    crmPool = new Pool({
      connectionString: process.env.CRM_DATABASE_URL,
      max: Number(process.env.CRM_POOL_MAX || 8),
      idleTimeoutMillis: 30_000,
      // Belt-and-braces: keep every CRM session read-only even if the role grant changed.
      options: "-c default_transaction_read_only=on",
    });
  }
  return crmPool;
}

export async function crmQuery(text, params) {
  const pool = getPool();
  if (!pool) throw new Error("CRM_DATABASE_URL not configured");
  return pool.query(text, params);
}
