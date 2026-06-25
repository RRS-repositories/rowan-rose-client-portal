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
import { requireAuth } from "../middleware/auth.js";
import { crmEnabled } from "../crmdb.js";
import {
  getClaimsByContactId,
  getClaimById,
  getRequirementsByContactId,
} from "../crm/repo.js";

export const clientRouter = Router();
clientRouter.use(requireAuth);

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
    const [claims, requirements] = crmEnabled() && req.contact
      ? await Promise.all([
          getClaimsByContactId(req.contact.id),
          getRequirementsByContactId(req.contact.id),
        ])
      : [[], []];
    res.json({
      client: {
        id: u.client_id || (req.contact ? req.contact.client_id || "" : ""),
        clientId: u.client_id || (req.contact ? req.contact.client_id || "" : ""),
        contactId: req.contact ? req.contact.id : null,
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
        claims,
        requirements,
        documents: [],
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
        clientId: u.client_id || "",
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
