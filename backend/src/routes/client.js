/**
 * /client/* — authenticated, per-client read endpoints backed by the live CRM
 * (read-only). The frontend's claim/dashboard/profile screens will call these
 * once VITE_USE_MOCKS is turned off (Phase 7.1 frontend wiring).
 *
 * Isolation: requireAuth resolves req.contact from the verified account. Every
 * query below is scoped to req.contact.id. A claim that isn't theirs (or is in a
 * hidden status) returns 404 — the existence of other claims is never revealed.
 */
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { crmEnabled, crmWriteEnabled } from "../crmdb.js";
import { query } from "../db.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import { s3Enabled, putObject, presignGet } from "../s3.js";
import {
  getClaimsByContactId,
  getClaimById,
  getRequirementsByContactId,
  getDocumentsByContactId,
  insertClientDocument,
  getOfferByClaimId,
} from "../crm/repo.js";
import { getNotificationsByContactId, markNotificationsRead } from "../portal/notificationsRepo.js";

export const clientRouter = Router();
clientRouter.use(requireAuth);

// In-memory upload (max 25MB) — file is streamed straight to S3, never to disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const IMG_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic"];

/** Upload document type → the client requirement kind it satisfies (mirrors
 *  RequirementKind in frontend types). Uploads of "other" satisfy nothing. */
const REQUIREMENT_KIND_BY_DOCTYPE = {
  id: "id",
  address: "address",
  "bank-statement": "bank-statements",
};

/** Liveness for the CRM link — handy while wiring the frontend. */
clientRouter.get("/status", (req, res) => {
  res.json({
    crmConnected: crmEnabled(),
    linked: Boolean(req.contact),
    clientId: req.user.client_id || null,
  });
});

/**
 * One-shot assembly of the logged-in client (claims + requirements) in the
 * frontend's Client shape, so the app can hydrate the dashboard in a single
 * call after login. Documents/messages stay empty until those endpoints exist.
 */
clientRouter.get("/bootstrap", async (req, res, next) => {
  try {
    const u = req.user;
    const parts = String(u.full_name).trim().split(/\s+/);
    const [claims, requirements, documents] = crmEnabled() && req.contact
      ? await Promise.all([
          getClaimsByContactId(req.contact.id),
          getRequirementsByContactId(req.contact.id),
          getDocumentsByContactId(req.contact),
        ])
      : [[], [], []];
    // Unread notifications ride along so the bell is right straight after
    // login; the feed itself comes from GET /client/notifications.
    let unreadNotifications = 0;
    if (req.contact) {
      try { ({ unread: unreadNotifications } = await getNotificationsByContactId(req.contact.id)); }
      catch (e) { console.warn("[bootstrap] notifications unavailable:", e.message); }
    }
    res.json({
      unreadNotifications,
      client: {
        // Client ID = "RR-" + CRM contact id (client_id column is often blank).
        id: req.contact ? `RR-${req.contact.id}` : (u.client_id || ""),
        clientId: req.contact ? `RR-${req.contact.id}` : (u.client_id || ""),
        contactId: req.contact ? req.contact.id : null,
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
        claims,
        requirements,
        documents,
      },
    });
  } catch (err) {
    next(err);
  }
});

clientRouter.get("/claims", async (req, res, next) => {
  try {
    if (!crmEnabled() || !req.contact) return res.json({ claims: [] });
    const claims = await getClaimsByContactId(req.contact.id);
    res.json({ claims });
  } catch (err) {
    next(err);
  }
});

clientRouter.get("/claims/:id", async (req, res, next) => {
  try {
    if (!crmEnabled() || !req.contact) return res.status(404).json({ message: "Claim not found." });
    const claim = await getClaimById(req.contact.id, req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found." });
    res.json({ claim });
  } catch (err) {
    next(err);
  }
});

clientRouter.get("/requirements", async (req, res, next) => {
  try {
    if (!crmEnabled() || !req.contact) return res.json({ requirements: [] });
    const requirements = await getRequirementsByContactId(req.contact.id);
    res.json({ requirements });
  } catch (err) {
    next(err);
  }
});

clientRouter.get("/documents", async (req, res, next) => {
  try {
    if (!crmEnabled() || !req.contact) return res.json([]);
    res.json(await getDocumentsByContactId(req.contact));
  } catch (err) {
    next(err);
  }
});

/** Upload a document → client's S3 folder (…/Documents/) + a CRM documents row. */
clientRouter.post("/documents/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.contact) return res.status(404).json({ success: false, message: "Account not linked." });
    if (!s3Enabled()) return res.status(503).json({ success: false, message: "Uploads are temporarily unavailable." });
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file was provided." });

    const documentType = String(req.body?.documentType || "other");
    // Per-claim asks (bank statements) carry the lender + CRM claim id so the
    // documents row is attributed to the right claim and the requirement flips
    // to "received". Absent for contact-level asks (ID).
    const lender = req.body?.lender ? String(req.body.lender) : null;
    const claimId = /^\d+$/.test(String(req.body?.claimId || "")) ? Number(req.body.claimId) : null;
    const safe = file.originalname.replace(/[\\/]+/g, "_").replace(/[^\w.\- ]/g, "_").slice(0, 180) || "upload";
    const key = `${req.contact.first_name}_${req.contact.last_name}_${req.contact.id}/Documents/${safe}`;
    await putObject(key, file.buffer, file.mimetype);

    // Best-effort: record it in the CRM so staff see the upload (needs portal_rw).
    if (crmWriteEnabled()) {
      try { await insertClientDocument(req.contact, file.originalname, file.size, key, documentType, { lender, claimId }); }
      catch (e) { console.warn("[upload] documents insert failed:", e.message); }
    }

    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    res.json({
      success: true,
      // Which client requirement kind this upload satisfies, so the page can
      // flip that card to "received". null for ad-hoc uploads (Other).
      requirementUpdated: REQUIREMENT_KIND_BY_DOCTYPE[documentType] || null,
      message: "Document uploaded. Thank you.",
      document: {
        id: Buffer.from(key).toString("base64url"),
        name: file.originalname,
        mime: file.mimetype || "application/octet-stream",
        fileSize: file.size,
        documentType,
        uploadedOn: new Date().toISOString(),
        status: "received",
        kind: IMG_EXT.includes(ext) ? "image" : "pdf",
        url: await presignGet(key),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Offers (Phase 7.3 Slice A) ──────────────────────────────────────────────
// The portal is a client of the CRM's EXISTING acceptance pipeline: the token
// is read server-side (never sent to the browser) and the signed acceptance is
// forwarded to the same public endpoint the email signing page uses. All
// artifact writing (S3 signature PNG, documents row, status flip, fee
// post-processing) stays in the CRM.
const CRM_PUBLIC_URL = process.env.CRM_PUBLIC_URL || "https://rowanroseclaims.co.uk";
// A drawn signature PNG is tens of KB; 1.5M base64 chars ≈ 1.1MB binary.
const MAX_SIGNATURE_CHARS = 1_500_000;

/** The claim's live offer (fee figures are the CRM's own verified numbers). */
clientRouter.get("/offers/:claimId", async (req, res, next) => {
  try {
    if (!crmEnabled() || !req.contact) return res.status(404).json({ message: "Offer not found." });
    const found = await getOfferByClaimId(req.contact.id, req.params.claimId);
    if (!found) return res.status(404).json({ message: "Offer not found." });
    res.json({ offer: found.offer }); // token deliberately stripped
  } catch (err) {
    next(err);
  }
});

/** Submit the signed acceptance → CRM's public accept endpoint. */
clientRouter.post("/offers/:claimId/accept", async (req, res, next) => {
  try {
    if (!crmEnabled() || !req.contact) return res.status(404).json({ success: false, message: "Offer not found." });

    const signatureData = String(req.body?.signatureData || "");
    if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signatureData) || signatureData.length > MAX_SIGNATURE_CHARS) {
      return res.status(400).json({ success: false, message: "Please draw your signature and try again." });
    }
    if (req.body?.agreedToTerms !== true) {
      return res.status(400).json({ success: false, message: "Please read and agree to the Terms of Acceptance first." });
    }

    const found = await getOfferByClaimId(req.contact.id, req.params.claimId);
    if (!found) return res.status(404).json({ success: false, message: "Offer not found." });
    if (found.offer.status === "accepted") {
      return res.json({ success: true, message: "This offer has already been accepted.", updatedStatus: "Offer Accepted" });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    let crmRes;
    try {
      crmRes = await fetch(`${CRM_PUBLIC_URL}/api/submit-offer-accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: found.token, signatureData }),
        signal: controller.signal,
      });
    } catch (e) {
      console.error(`[offer-accept] CRM call failed for case ${found.caseId}:`, e.message);
      return res.status(502).json({ success: false, message: "We couldn't submit your acceptance just now. Please try again in a few minutes." });
    } finally {
      clearTimeout(timer);
    }

    const body = await crmRes.json().catch(() => ({}));
    if (!crmRes.ok || body.success !== true) {
      console.error(`[offer-accept] CRM rejected acceptance for case ${found.caseId}: HTTP ${crmRes.status} ${body.message || ""}`);
      return res.status(502).json({ success: false, message: "We couldn't submit your acceptance just now. Please try again, or contact us and we'll sort it." });
    }

    console.log(`[offer-accept] contact ${req.contact.id} accepted offer on case ${found.caseId} via portal`);
    res.json({ success: true, message: "Offer accepted successfully. The lender will process payment within 28 days.", updatedStatus: "Offer Accepted" });
  } catch (err) {
    next(err);
  }
});

/** The client's notification feed (bell) + unread count over the same rows. */
clientRouter.get("/notifications", async (req, res, next) => {
  try {
    if (!req.contact) return res.json({ notifications: [], unread: 0 });
    res.json(await getNotificationsByContactId(req.contact.id));
  } catch (err) {
    next(err);
  }
});

/** Mark notifications read: body { ids?: string[] } — omitted/empty = all. */
clientRouter.post("/notifications/read", async (req, res, next) => {
  try {
    if (!req.contact) return res.json({ success: true, updated: 0 });
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const updated = await markNotificationsRead(req.contact.id, ids);
    res.json({ success: true, updated });
  } catch (err) {
    next(err);
  }
});

/** Change password for the logged-in client (replaces the default DOB password). */
clientRouter.post("/change-password", async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    const { rows } = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (!rows[0] || !(await verifyPassword(currentPassword, rows[0].password_hash))) {
      return res.json({ success: false, message: "Your current password is incorrect." });
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.json({ success: false, message: "New password must be 8+ characters with upper, lower and a number." });
    }
    const hash = await hashPassword(newPassword);
    await query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [hash, req.user.id]);
    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
});

clientRouter.get("/profile", async (req, res, next) => {
  try {
    const u = req.user;
    const parts = String(u.full_name).trim().split(/\s+/);
    const claims = crmEnabled() && req.contact ? await getClaimsByContactId(req.contact.id) : [];
    const active = claims.filter(
      (c) => !["Completed", "Closed"].includes(
        // active = not in a terminal client-facing phase
        ({ "Client Paid": "Completed", "Claim Closed": "Closed" })[c.internalStatus] || "active",
      ),
    ).length;
    res.json({
      profile: {
        clientId: req.contact ? `RR-${req.contact.id}` : (u.client_id || ""),
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
        dateOfBirth: u.dob ? new Date(u.dob).toISOString() : "",
        email: u.email,
        phone: u.phone,
        registeredAt: u.created_at ? new Date(u.created_at).toISOString() : "",
        totalClaims: claims.length,
        activeClaims: active,
        passwordLastChanged: null,
      },
    });
  } catch (err) {
    next(err);
  }
});
