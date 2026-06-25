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
import { crmQuery } from "../crmdb.js";
import { mapStatus, isEscalatedStatus } from "./statusMap.js";

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

// ── Documents ───────────────────────────────────────────────────────────────

const DOC_TYPE = {
  "id document": "id", id: "id", identification: "id",
  "proof of address": "address", poa: "address",
  "bank statement": "bank-statement",
};
const extMime = (ext, type) => {
  const e = String(ext || "").toLowerCase().replace(/^\./, "");
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(e) || type === "image") return `image/${e || "jpeg"}`;
  if (e === "pdf" || type === "pdf") return "application/pdf";
  if (["doc", "docx"].includes(e) || type === "docx") return "application/msword";
  return "application/octet-stream";
};
const DOC_STATUS = { uploaded: "received", completed: "verified", received: "received", rejected: "rejected" };

/**
 * Client-visible documents only. Excludes the ~397k internal "Draft" docs
 * (firm-generated LOAs/cover/complaint letters), deleted/archived files, and
 * anything in hidden_documents. Shows the client's own uploads + completed docs.
 */
export async function getDocumentsByContactId(contactId) {
  const { rows } = await crmQuery(
    `SELECT d.id, d.name, d.category, d.type, d.file_extension, d.file_size_bytes,
            d.document_status, d.lender, d.created_at
       FROM public.documents d
      WHERE d.contact_id = $1
        AND COALESCE(d.is_deleted, false) = false
        AND COALESCE(d.archived, false) = false
        AND lower(COALESCE(d.document_status, '')) IN ('uploaded', 'completed', 'received')
        AND NOT EXISTS (
          SELECT 1 FROM public.hidden_documents h
           WHERE h.contact_id = d.contact_id AND h.s3_key = d.s3_key
        )
      ORDER BY d.created_at DESC`,
    [contactId],
  );
  return rows.map((d) => ({
    id: String(d.id),
    name: d.name || "Document",
    mime: extMime(d.file_extension, d.type),
    fileSize: Number(d.file_size_bytes) || 0,
    documentType: DOC_TYPE[String(d.category || "").toLowerCase()] || "other",
    uploadedOn: iso(d.created_at) || "",
    status: DOC_STATUS[String(d.document_status || "").toLowerCase()] || "received",
    lenderName: d.lender || undefined,
    kind: String(d.type || "").toLowerCase() === "image" ? "image" : "pdf",
  }));
}

const REQ_KIND = {
  id: "id",
  identification: "id",
  poa: "address",
  "proof of address": "address",
  address: "address",
  "bank statement": "bank-statements",
  "bank statements": "bank-statements",
  questionnaire: "questionnaire",
  "extra lender": "extra-lender",
};

/** Outstanding (is_satisfied = false) requirements for a contact. Requirements
 *  tied to a claim that is hidden (e.g. Not Qualified) are dropped, so the
 *  client never sees document asks for a claim they can't see. Client-level
 *  requirements (no claim_id) are always kept. */
export async function getRequirementsByContactId(contactId) {
  const { rows } = await crmQuery(
    `SELECT rd.id, rd.claim_id, rd.lender, rd.category, rd.is_satisfied, rd.created_at,
            k.status AS case_status
       FROM public.required_documents rd
       LEFT JOIN public.cases k ON k.id = rd.claim_id
      WHERE rd.contact_id = $1 AND COALESCE(rd.is_satisfied, false) = false
      ORDER BY rd.created_at ASC`,
    [contactId],
  );
  return rows
    .filter((r) => r.claim_id == null || mapStatus(r.case_status) !== null)
    .map((r) => {
    const kind = REQ_KIND[String(r.category || "").toLowerCase()] || "questionnaire";
    return {
      id: String(r.id),
      kind,
      title: r.category || "Document required",
      description: "Please provide this so we can progress your claim.",
      icon: "upload_file",
      done: false,
      lenderName: r.lender || undefined,
      claimId: r.claim_id != null ? String(r.claim_id) : undefined,
      action: "Upload",
    };
  });
}
