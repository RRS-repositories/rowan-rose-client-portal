/**
 * CRM data-access layer (READ-ONLY). The rest of the app never writes raw CRM
 * SQL — it calls these functions, which:
 *   - scope every query to a single contact (per-client data isolation)
 *   - filter out claims in hidden internal statuses (statusMap → null)
 *   - map raw CRM rows into the shapes the frontend already expects
 *     (frontend/app/src/data/types.ts: Claim, Requirement, ClientProfile)
 *
 * CRM tables used: contacts, cases, documents, required_documents.
 */
import { crmQuery, crmWriteQuery } from "../crmdb.js";
import { mapStatus, isEscalatedStatus } from "./statusMap.js";
import { s3Enabled, contactPrefix, listByPrefix, presignGet } from "../s3.js";

// ── Contacts (clients) ──────────────────────────────────────────────────────

/** Resolve the CRM contact for a portal user's linked client_id. Null if none. */
export async function getContactByClientId(clientId) {
  if (!clientId) return null;
  const { rows } = await crmQuery(
    `SELECT id, client_id, first_name, last_name, full_name, email, phone, dob,
            created_at
       FROM public.contacts
      WHERE client_id = $1 AND COALESCE(is_deleted, false) = false
      LIMIT 1`,
    [clientId],
  );
  return rows[0] ?? null;
}

/** CRM contacts with this email. When a client is duplicated in the CRM, the
 *  rows are ordered so the FIRST is the best one to use: most claims first, then
 *  the most recently created. Callers `.find()` the DOB match, which therefore
 *  lands on the max-claims / latest contact. */
export async function getContactsByEmail(email) {
  if (!email) return [];
  const { rows } = await crmQuery(
    `SELECT c.id, c.client_id, c.first_name, c.last_name, c.full_name, c.email, c.phone, c.dob,
            (SELECT count(*) FROM public.cases k WHERE k.contact_id = c.id) AS claim_count
       FROM public.contacts c
      WHERE lower(c.email) = lower($1) AND COALESCE(c.is_deleted, false) = false
      ORDER BY claim_count DESC, c.created_at DESC NULLS LAST, c.id DESC`,
    [email],
  );
  return rows;
}

/**
 * Match a registering client against CRM records (first/last/dob/email).
 * Returns the contact's client_id on a confident match, else null. Used by
 * registration so a portal login links to exactly one CRM contact.
 */
export async function matchClient({ firstName, lastName, dob, email }) {
  const { rows } = await crmQuery(
    `SELECT client_id
       FROM public.contacts
      WHERE lower(email) = lower($1)
        AND lower(last_name) = lower($2)
        AND dob = $3::date
        AND client_id IS NOT NULL
        AND COALESCE(is_deleted, false) = false
      LIMIT 2`,
    [email, lastName, dob],
  );
  if (rows.length === 1) return rows[0].client_id;
  return null; // 0 = no match, 2+ = ambiguous — both rejected for safety
}

// ── Mappers ─────────────────────────────────────────────────────────────────

const initialsOf = (name) =>
  String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

const num = (v) => (v == null || v === "" ? undefined : Number(v));
const iso = (d) => (d ? new Date(d).toISOString() : undefined);

/** Build the client-facing timeline from whichever CRM date columns are set. */
function buildTimeline(c) {
  const steps = [
    [c.created_at, "Claim opened", "flag"],
    [c.dsar_sent_at, "Records requested from the lender", "mail"],
    [c.complaint_submitted_at, "Complaint submitted to the lender", "gavel"],
    [c.frl_date, "Lender responded", "inbox"],
    [c.offer_email_sent_date, "Offer received", "savings"],
    [c.payment_received_date, "Payment received", "payments"],
    [c.client_paid_date, "Settlement paid to you", "check_circle"],
  ];
  return steps
    .filter(([d]) => d)
    .map(([d, text, icon], i) => ({ id: `t${i}`, text, date: iso(d), icon }));
}

/** Map a raw `cases` row → frontend Claim, or null if the status is hidden. */
export function mapCaseToClaim(c) {
  const internalStatus = mapStatus(c.status);
  if (!internalStatus) return null; // hidden — never expose

  const lenderName = c.lender || c.lender_other || "Your lender";
  const offer = num(c.offer_made) ?? num(c.redress_amount);
  const gross = num(c.total_refund) ?? num(c.redress_amount);
  const paymentDate = iso(c.payment_received_date);

  const financials =
    offer != null || gross != null || paymentDate
      ? { offer, gross, paymentDate }
      : undefined;

  return {
    id: c.case_number || String(c.id),
    lender: {
      name: lenderName,
      initials: initialsOf(lenderName),
      brand: "#003c60",
      product: c.product_type || "Credit agreement",
      icon: "account_balance",
    },
    internalStatus,
    escalated: Boolean(c.fos_active) || isEscalatedStatus(internalStatus),
    openedOn: iso(c.created_at) || iso(c.start_date) || "",
    financials,
    timeline: buildTimeline(c),
    unreadMessages: 0, // messages not yet wired (read-only phase)
  };
}

// ── Claims ──────────────────────────────────────────────────────────────────

// Only the columns the mapper needs — never SELECT * on a 444-column table.
const CASE_COLS = `id, contact_id, case_number, lender, lender_other, status,
  claim_value, product_type, offer_made, redress_amount, total_refund,
  fos_active, created_at, start_date, dsar_sent_at, complaint_submitted_at,
  frl_date, offer_email_sent_date, payment_received_date, client_paid_date`;

/** All of a contact's claims, hidden statuses filtered out, newest first. */
export async function getClaimsByContactId(contactId) {
  const { rows } = await crmQuery(
    `SELECT ${CASE_COLS} FROM public.cases
      WHERE contact_id = $1
      ORDER BY created_at DESC NULLS LAST`,
    [contactId],
  );
  return rows.map(mapCaseToClaim).filter(Boolean);
}

/**
 * A single claim by its case_number (or numeric id), scoped to the contact.
 * Returns null if it doesn't exist, isn't theirs, or is hidden — the caller
 * returns 404 either way, so other clients' claims are never revealed.
 */
export async function getClaimById(contactId, claimKey) {
  const numericId = /^\d+$/.test(String(claimKey)) ? Number(claimKey) : null;
  const { rows } = await crmQuery(
    `SELECT ${CASE_COLS} FROM public.cases
      WHERE contact_id = $1 AND (case_number = $2 OR id = $3)
      LIMIT 1`,
    [contactId, String(claimKey), numericId],
  );
  if (!rows[0]) return null;
  return mapCaseToClaim(rows[0]);
}

// ── Requirements (outstanding documents) ────────────────────────────────────

// ── Documents (listed straight from the client's S3 folder) ──────────────────

const IMG_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic"];
const extMime = (ext) => {
  const e = String(ext || "").toLowerCase().replace(/^\./, "");
  if (IMG_EXT.includes(e)) return `image/${e}`;
  if (e === "pdf") return "application/pdf";
  if (["doc", "docx"].includes(e)) return "application/msword";
  if (["xls", "xlsx", "csv"].includes(e)) return "application/vnd.ms-excel";
  return "application/octet-stream";
};

/** Coarse document type from the file's sub-folder path (for icon/grouping). */
function docTypeFromPath(rel) {
  const p = rel.toLowerCase();
  if (p.includes("id_document") || p.includes("identification") || /(^|\/)id(\/|_)/.test(p)) return "id";
  if (p.includes("proof_of_address") || p.includes("poa")) return "address";
  if (p.includes("statement") || p.includes("bank")) return "bank-statement";
  if (p.includes("loa") || p.includes("letter_of_authority")) return "loan-agreement";
  return "other";
}

const CATEGORY_BY_DOCTYPE = {
  id: "ID Document", address: "Proof of Address", "bank-statement": "Bank Statement",
  "loan-agreement": "Letter of Authority", other: "Client",
};

/**
 * ALL of a client's files, listed directly from their S3 folder
 * `{first}_{last}_{id}/` (every sub-folder — Documents/, Lenders/…). Folder
 * markers and zero-byte keys are skipped, and anything the firm has hidden
 * (hidden_documents) is excluded. Each file gets a short-lived presigned URL.
 * Takes the CRM contact object (needs first/last/id to build the prefix).
 */
export async function getDocumentsByContactId(contact) {
  if (!contact || !s3Enabled()) return [];
  const prefix = contactPrefix(contact);
  const [objects, hiddenRes] = await Promise.all([
    listByPrefix(prefix),
    crmQuery("SELECT s3_key FROM public.hidden_documents WHERE contact_id = $1", [contact.id]).catch(() => ({ rows: [] })),
  ]);
  const hidden = new Set(hiddenRes.rows.map((r) => r.s3_key));
  const files = objects
    .filter((o) => o.Key && !o.Key.endsWith("/") && (o.Size || 0) > 0 && !hidden.has(o.Key))
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .slice(0, 300);
  return Promise.all(files.map(async (o) => {
    const rel = o.Key.slice(prefix.length);
    const name = rel.split("/").pop();
    const ext = (name.split(".").pop() || "").toLowerCase();
    return {
      id: Buffer.from(o.Key).toString("base64url"),
      name,
      mime: extMime(ext),
      fileSize: Number(o.Size) || 0,
      documentType: docTypeFromPath(rel),
      uploadedOn: new Date(o.LastModified).toISOString(),
      status: "received",
      lenderName: rel.toLowerCase().startsWith("lenders/") ? (rel.split("/")[1] || "").replace(/_/g, " ") : undefined,
      kind: IMG_EXT.includes(ext) ? "image" : "pdf",
      folder: rel.includes("/") ? rel.split("/").slice(0, -1).join("/") : "",
      url: await presignGet(o.Key),
    };
  }));
}

/** Record a portal upload in the CRM documents table so staff see it. When the
 *  upload satisfies a per-claim ask (bank statements) it's tagged with the claim
 *  + lender so staff — and the requirements read below — can match it. Always
 *  tagged 'Portal' so client uploads are distinguishable from firm/lender docs. */
export async function insertClientDocument(contact, originalName, sizeBytes, s3Key, documentType, { lender = null, claimId = null } = {}) {
  const ext = (originalName.split(".").pop() || "").toLowerCase();
  const sizeKB = `${(Number(sizeBytes) / 1024).toFixed(1)} KB`;
  const category = CATEGORY_BY_DOCTYPE[documentType] || "Client";
  await crmWriteQuery(
    `INSERT INTO documents (contact_id, claim_id, name, type, category, lender, url, size, s3_key, document_status, file_size_bytes, tags, uploaded_by_name, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'uploaded',$10,$11,$12, now())`,
    [contact.id, claimId, originalName, ext, category, lender, "", sizeKB, s3Key, Number(sizeBytes) || 0, ["Uploaded", "Portal"], `${contact.first_name} ${contact.last_name}`.trim()],
  );
}

// What the firm is actively asking THIS client to provide.
//
// Deliberately NOT sourced from `required_documents`: that table tracks the
// firm's own case-file letters (Letter of Authority / Cover Letter / Complaint
// Letter, auto-seeded per claim) — documents the firm generates, never client
// obligations. Showing them made every client "upload" three firm letters.
//
// Instead we derive asks from the CRM's real client-request signals and mark
// each "received" the moment the client's own portal upload lands (the tagged
// `documents` row this portal inserts — which staff also see). The ask only
// re-appears when the firm re-requests: for ID when the id-chase is re-armed
// (id_chase_started_at moves past the last upload); for bank statements when the
// case is (re)set to "Bank Statements Requested" after the last upload.
//
// Scope (this pass): ID/identity + bank statements. Signature/LoA and the other
// client asks (questionnaire, extra-lender, offer acceptance, FOS) come later.

const BANK_REQUEST_STATUS = "bank statements requested";
const ms = (v) => (v ? new Date(v).getTime() : 0);

/** Portal-uploaded documents for a contact, newest-per (claim, category). Only
 *  rows this portal wrote (tag 'Portal') count toward "received" — never firm or
 *  lender documents. */
async function getPortalUploads(contactId) {
  const { rows } = await crmQuery(
    `SELECT claim_id, category, max(created_at) AS uploaded_at
       FROM public.documents
      WHERE contact_id = $1 AND tags && ARRAY['Portal']::text[]
      GROUP BY claim_id, category`,
    [contactId],
  );
  return rows;
}

/**
 * The client's outstanding (and just-received) document asks. Each item is
 * either `done:false` ("please upload …") or `done:true` ("received — thank
 * you"); the client only ever sees these two states — never the file itself,
 * and never a firm-generated document.
 */
export async function getRequirementsByContactId(contactId) {
  const [contactRes, casesRes, uploads] = await Promise.all([
    crmQuery(
      `SELECT id_chase_active, id_chase_started_at, identity_status, identity_confirmed_at
         FROM public.contacts WHERE id = $1 LIMIT 1`,
      [contactId],
    ),
    crmQuery(
      `SELECT id, lender, lender_other, status, updated_at
         FROM public.cases WHERE contact_id = $1`,
      [contactId],
    ),
    getPortalUploads(contactId),
  ]);
  const contact = contactRes.rows[0];
  const reqs = [];

  // ── ID / identity verification (contact-level, one per client) ──
  if (contact && contact.id_chase_active && !contact.identity_confirmed_at) {
    const requestedAt = ms(contact.id_chase_started_at);
    const up = uploads.find((u) => u.claim_id == null && /^id/i.test(String(u.category)));
    // "needs_review" means an ID is already in with the firm being checked.
    const received =
      String(contact.identity_status || "").toLowerCase() === "needs_review" ||
      Boolean(up && ms(up.uploaded_at) >= requestedAt);
    reqs.push({
      id: `id-${contactId}`,
      kind: "id",
      title: "Verify your identity",
      description: received
        ? "Received — thank you. We'll be in touch if we need anything else."
        : "Please upload photo ID (passport or driving licence), or a recent utility or council-tax bill.",
      icon: "badge",
      done: received,
      receivedOn: received && up ? iso(up.uploaded_at) : undefined,
      action: "Upload",
    });
  }

  // ── Bank statements (per claim / lender) ──
  for (const k of casesRes.rows) {
    if (String(k.status || "").trim().toLowerCase() !== BANK_REQUEST_STATUS) continue;
    if (mapStatus(k.status) === null) continue; // never surface a hidden claim
    const claimId = String(k.id);
    const lender = k.lender || k.lender_other || "your lender";
    // No status-change timestamp exists on cases, so `updated_at` is the request
    // reference. Good enough while the ask is live; a precise per-request signal
    // (bank-statement request token) is a later refinement.
    const requestedAt = ms(k.updated_at);
    const up = uploads.find(
      (u) => String(u.claim_id) === claimId && /bank statement/i.test(String(u.category)),
    );
    const received = Boolean(up && ms(up.uploaded_at) >= requestedAt);
    reqs.push({
      id: `bank-${claimId}`,
      kind: "bank-statements",
      title: `Bank statements — ${lender}`,
      description: received
        ? "Received — thank you. We'll be in touch if we need anything else."
        : `Please upload your bank statements for your ${lender} claim so we can progress it.`,
      icon: "account_balance",
      done: received,
      receivedOn: received ? iso(up.uploaded_at) : undefined,
      lenderName: lender,
      claimId,
      action: "Upload",
    });
  }

  return reqs;
}
