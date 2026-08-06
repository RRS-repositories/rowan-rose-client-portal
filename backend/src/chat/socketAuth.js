/**
 * Socket.io handshake auth. Same JWT, same verification, same contact
 * resolution as REST (middleware/auth.js resolveSession) — chat is exactly as
 * secure as the rest of the portal. contactId is attached server-side here and
 * is THE security boundary: every subsequent query is scoped to it, and no
 * client payload can override it.
 */
import { resolveSession } from "../middleware/auth.js";

export async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token || null;
    const session = await resolveSession(token);
    if (!session) return next(new Error("unauthorised"));
    // Chat needs the CRM link — an unlinked account has no claims to discuss.
    if (!session.contact) return next(new Error("unauthorised"));
    socket.data.contactId = session.contact.id;
    socket.data.firstName =
      session.contact.first_name ||
      String(session.user.full_name || "").trim().split(/\s+/)[0] ||
      "there";
    next();
  } catch {
    next(new Error("unauthorised"));
  }
}
