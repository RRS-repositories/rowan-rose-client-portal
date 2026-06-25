/**
 * Session auth + per-client scoping.
 *
 * requireAuth verifies the session JWT, loads the portal user, and resolves the
 * linked CRM contact. Every /client/* route runs behind this, so a handler only
 * ever sees data for the authenticated client's own contact — the client_id
 * comes from the verified token/account, never from the request.
 */
import { verifyToken } from "../lib/auth.js";
import { query } from "../db.js";
import { crmEnabled } from "../crmdb.js";
import { getContactByClientId } from "../crm/repo.js";

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
    req.contact = crmEnabled() && rows[0].client_id
      ? await getContactByClientId(rows[0].client_id)
      : null;
    next();
  } catch (err) {
    next(err);
  }
}
