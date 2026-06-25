/**
 * Session auth + per-client scoping.
 *
 * requireAuth verifies the session JWT, loads the portal user, and resolves the
 * linked CRM contact. Every /client/* route runs behind this, so a handler only
 * ever sees data for the authenticated client's own contact — the client_id
 * comes from the verified token/account, never from the request.
 */
import { verifyToken, defaultPasswordFromDob } from "../lib/auth.js";
import { query } from "../db.js";
import { crmEnabled } from "../crmdb.js";
import { getContactByClientId, getContactsByEmail } from "../crm/repo.js";

/**
 * Resolve the CRM contact for a portal user. Primary path is the linked
 * client_id; fallback matches by email + DOB so contacts that don't yet have a
 * client_id populated (e.g. freshly-created records) still link to their claims.
 */
async function resolveContact(user) {
  if (!crmEnabled()) return null;
  if (user.client_id) {
    const c = await getContactByClientId(user.client_id);
    if (c) return c;
  }
  if (user.email && user.dob) {
    const dobPw = defaultPasswordFromDob(user.dob);
    const candidates = await getContactsByEmail(user.email);
    return candidates.find((c) => defaultPasswordFromDob(c.dob) === dobPw) ?? null;
  }
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const decoded = token ? verifyToken(token, "session") : null;
    if (!decoded) return res.status(401).json({ message: "Please log in to continue." });

    const { rows } = await query(
      "SELECT id, email, full_name, phone, dob, client_id, created_at FROM users WHERE id = $1",
      [decoded.sub],
    );
    if (!rows[0]) return res.status(401).json({ message: "Account not found." });

    req.user = rows[0];
    // Resolve the CRM contact once per request (null if unlinked or CRM disabled).
    req.contact = await resolveContact(rows[0]);
    next();
  } catch (err) {
    next(err);
  }
}
