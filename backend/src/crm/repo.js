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

// ── Offers (Phase 7.3 Slice A) ──────────────────────────────────────────────
// A case is "armed" for acceptance once Verify Outcome has minted
// offer_accept_token with a real amount, while the status is one the CRM's
// acceptance-email flow still treats as sendable. 'CHASING DEBT' is deliberately
// excluded (Brad, 2026-08-05): the portal renders those claims as closed.
const OFFER_ASK_STATUSES = new Set(["upheld", "offer accepted", "awaiting payment"]);
const isOfferAskStatus = (s) => OFFER_ASK_STATUSES.has(String(s || "").trim().toLowerCase());
const offerArmed = (c) =>
  Boolean(c.offer_accept_token) && Number(c.offer_made) > 0 && isOfferAskStatus(c.status);

/**
 * The CRM's per-claim "client signed" signal: client_communications_tracking
 * rows flipped to Completed by the signing flow. Returns Map<claimId, signedAt>
 * — or null when the table isn't readable yet (its GRANT ships with the 7.3
 * DDL); callers must then leave offer state alone rather than guess.
 */
async function getAcceptedOffers(contactId) {
  try {
    const { rows } = await crmQuery(
      `SELECT claim_id, completed_at
         FROM public.client_communications_tracking
        WHERE client_id = $1 AND type = 'offer_acceptance' AND status = 'Completed'
          AND claim_id IS NOT NULL`,
      [contactId],
    );
    return new Map(rows.map((r) => [String(r.claim_id), iso(r.completed_at)]));
  } catch {
    return null;
  }
}

/** Map a raw `cases` row → frontend Claim, or null if the status is hidden. */
export function mapCaseToClaim(c, { acceptedOffers = null } = {}) {
  let internalStatus = mapStatus(c.status);
  if (!internalStatus) return null; // hidden — never expose

  // Armed-offer override: a minted acceptance token the client hasn't signed
  // shows as "Offer Received" so the review/accept UI opens. The raw status
  // can't carry this — 'Upheld' maps to FRL Received, and agents advance to
  // 'Offer Accepted' within a minute of Verify regardless of signing.
  let offerActionedAt;
  if (acceptedOffers && offerArmed(c)) {
    const signedAt = acceptedOffers.get(String(c.id));
    if (signedAt) {
      internalStatus = "Offer Accepted";
      offerActionedAt = signedAt;
    } else {
      internalStatus = "Offer Received";
    }
  }

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
    offerActionedAt,
    financials,
    timeline: buildTimeline(c),
    unreadMessages: 0, // messages not yet wired (read-only phase)
  };
}

// ── Claims ──────────────────────────────────────────────────────────────────

// Only the columns the mapper needs — never SELECT * on a 444-column table.
// offer_accept_token is read for the armed-offer override ONLY: the mapper
// never serialises it into the Claim.
const CASE_COLS = `id, contact_id, case_number, lender, lender_other, status,
  claim_value, product_type, offer_made, redress_amount, total_refund,
  offer_accept_token, fos_active, created_at, start_date, dsar_sent_at,
  complaint_submitted_at, frl_date, offer_email_sent_date,
  payment_received_date, client_paid_date`;

/** All of a contact's claims, hidden statuses filtered out, newest first. */
export async function getClaimsByContactId(contactId) {
  const [{ rows }, acceptedOffers] = await Promise.all([
    crmQuery(
      `SELECT ${CASE_COLS} FROM public.cases
        WHERE contact_id = $1
        ORDER BY created_at DESC NULLS LAST`,
      [contactId],
    ),
    getAcceptedOffers(contactId),
  ]);
  return rows.map((c) => mapCaseToClaim(c, { acceptedOffers })).filter(Boolean);
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
  return mapCaseToClaim(rows[0], { acceptedOffers: await getAcceptedOffers(contactId) });
}

// ── Offer details & acceptance (Phase 7.3 Slice A) ──────────────────────────

const gbpFmt = (n) =>
  `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Terms of Acceptance text, built from the CRM's own verified figures. Kept in
 *  step with the mock's buildTermsText (frontend/app/src/data/offers.ts) so the
 *  client reads the same document in both modes. */
function buildOfferTerms(lenderName, offerAmount, feePct, feeIncVat, net) {
  return `TERMS OF ACCEPTANCE

By accepting this offer, you ("the Client") agree to the following terms:

1. SETTLEMENT AMOUNT
The lender, ${lenderName}, has offered a settlement of ${gbpFmt(offerAmount)} in full and final settlement of your complaint regarding irresponsible lending.

2. FULL AND FINAL SETTLEMENT
Acceptance of this offer constitutes a full and final settlement of your complaint. You will not be able to pursue any further claims against the lender in relation to this matter.

3. FEES
Rowan Rose Solicitors will deduct their agreed fee of ${feePct}% (plus VAT) from the settlement amount. The estimated fee, inclusive of VAT, is ${gbpFmt(feeIncVat)}, leaving an estimated net payment to you of ${gbpFmt(net)}.

4. PAYMENT TIMELINE
The lender has agreed to make payment within 28 days of receiving the signed acceptance. Rowan Rose Solicitors will process your payment within 5 working days of receiving the funds from the lender.

5. WITHDRAWAL
Once this acceptance is signed and submitted, it cannot be withdrawn. Please ensure you are satisfied with the terms before signing.

6. DATA PROCESSING
Your signed acceptance will be stored securely in compliance with GDPR. The signature and acceptance record will be shared with the lender as proof of your agreement.

7. GOVERNING LAW
This agreement is governed by the laws of England and Wales.

If you have any questions about these terms, please contact your claims handler before signing.`;
}

// ── Signature / Letter of Authority (Phase 7.3 Slice B) ─────────────────────

/**
 * Tokens this contact has COMPLETED on the signing tracking table (any type —
 * tokens are unique uuids, so no type filter is needed). Case tokens
 * (resign_token, fos_referral_token) are never nulled after completion, so
 * armed-ness is always judged per-token against this set. Null when the
 * tracking table isn't readable — callers then show nothing rather than guess.
 */
async function getCompletedTrackingTokens(contactId) {
  try {
    const { rows } = await crmQuery(
      `SELECT token FROM public.client_communications_tracking
        WHERE client_id = $1 AND status = 'Completed' AND token IS NOT NULL`,
      [contactId],
    );
    return new Set(rows.map((r) => String(r.token)));
  } catch {
    return null;
  }
}

/** True when this case has a live, not-yet-signed Resend-LOA request. */
const signatureArmed = (c, completedTokens) =>
  Boolean(c.resign_token) && !completedTokens.has(String(c.resign_token));

/** True when this case has a live, not-yet-approved FOS referral. */
const fosArmed = (c, completedTokens) =>
  Boolean(c.fos_referral_token) && !completedTokens.has(String(c.fos_referral_token));

/**
 * Which chase workflows are live for this contact (Phase 7.3 Slice C) — the
 * CRM's workflow_triggers registry drives the questionnaire and extra-lender
 * asks. Null when the registry isn't readable (pre-GRANT) — show nothing.
 */
async function getActiveChaseWorkflows(contactId) {
  try {
    const { rows } = await crmQuery(
      `SELECT workflow_type FROM public.workflow_triggers
        WHERE client_id = $1
          AND workflow_type IN ('Questionnaire Chase', 'questionnaire_chase',
                                'Extra Lender Chase', 'extra_lender_chase')
          AND status IN ('pending', 'active', 'awaiting_response')`,
      [contactId],
    );
    const types = new Set(rows.map((r) => String(r.workflow_type).toLowerCase().replace(/_/g, " ")));
    return { questionnaire: types.has("questionnaire chase"), extraLender: types.has("extra lender chase") };
  } catch {
    return null;
  }
}

const CRM_PUBLIC_BASE = () => process.env.CRM_PUBLIC_URL || "https://rowanroseclaims.co.uk";

/** The client's live questionnaire form URL — the same token page the chase
 *  email carries. Null while the worker hasn't minted a token yet (it does so
 *  within its next cycle after arming). */
export async function getQuestionnaireLink(contactId) {
  try {
    const { rows } = await crmQuery(
      `SELECT token FROM public.questionnaire_tokens
        WHERE contact_id = $1 AND submitted = false
        ORDER BY (questionnaire_type = 2) DESC
        LIMIT 1`,
      [contactId],
    );
    if (!rows[0]) return null;
    return `${CRM_PUBLIC_BASE()}/questionnaire/token/${rows[0].token}`;
  } catch {
    return null;
  }
}

/** The client's live extra-lender selection URL (from the tracking row the
 *  chase engine keys its reminders on). Null before the first send. */
export async function getExtraLenderLink(contactId) {
  try {
    const { rows } = await crmQuery(
      `SELECT token FROM public.client_communications_tracking
        WHERE client_id = $1 AND type = 'extra_lender'
          AND token IS NOT NULL AND status IS DISTINCT FROM 'Completed'
        LIMIT 1`,
      [contactId],
    );
    if (!rows[0]) return null;
    return `${CRM_PUBLIC_BASE()}/loa-form/${rows[0].token}`;
  } catch {
    return null;
  }
}

/** The claim's live FOS retainer e-sign URL — only while armed and unsigned. */
export async function getFosLink(contactId, claimKey) {
  const numericId = /^\d+$/.test(String(claimKey)) ? Number(claimKey) : -1;
  const { rows } = await crmQuery(
    `SELECT id, status, fos_referral_token FROM public.cases
      WHERE contact_id = $1 AND (case_number = $2 OR id = $3)
      LIMIT 1`,
    [contactId, String(claimKey), numericId],
  );
  const c = rows[0];
  if (!c || !c.fos_referral_token || mapStatus(c.status) === null) return null;
  const completed = await getCompletedTrackingTokens(contactId);
  if (completed === null || !fosArmed(c, completed)) return null;
  return `${CRM_PUBLIC_BASE()}/fos-retainer/${c.fos_referral_token}`;
}

/**
 * The CRM signing-page URL for the claim's live Resend-LOA request — the same
 * link the chase email carries, served only to the authenticated owner. Null
 * when there's nothing to sign (no token, already signed, hidden claim, or
 * tracking unreadable).
 */
export async function getResignLink(contactId, claimKey) {
  const numericId = /^\d+$/.test(String(claimKey)) ? Number(claimKey) : -1;
  const { rows } = await crmQuery(
    `SELECT id, status, resign_token FROM public.cases
      WHERE contact_id = $1 AND (case_number = $2 OR id = $3)
      LIMIT 1`,
    [contactId, String(claimKey), numericId],
  );
  const c = rows[0];
  if (!c || !c.resign_token || mapStatus(c.status) === null) return null;
  const completed = await getCompletedTrackingTokens(contactId);
  if (completed === null || !signatureArmed(c, completed)) return null;
  return `${CRM_PUBLIC_BASE()}/resign/${c.resign_token}`;
}

/**
 * The claim's live offer, in the frontend OfferDetails shape, plus the
 * acceptance token for SERVER-SIDE use only — routes must strip `token` before
 * responding. Null when the claim is hidden, not armed, already past the
 * acceptance window without signing, or when acceptance state is unreadable
 * (pre-GRANT window) — never guess about a legal signing step.
 */
export async function getOfferByClaimId(contactId, claimKey) {
  const numericId = /^\d+$/.test(String(claimKey)) ? Number(claimKey) : -1;
  const { rows } = await crmQuery(
    `SELECT id, case_number, lender, lender_other, status, offer_made,
            fee_percentage, fee_total, client_payout, offer_accept_token,
            frl_outcome_verified_at, updated_at
       FROM public.cases
      WHERE contact_id = $1 AND (case_number = $2 OR id = $3)
      LIMIT 1`,
    [contactId, String(claimKey), numericId],
  );
  const c = rows[0];
  if (!c || mapStatus(c.status) === null) return null;
  if (!c.offer_accept_token || !(Number(c.offer_made) > 0)) return null; // not armed

  const acceptedOffers = await getAcceptedOffers(contactId);
  if (acceptedOffers === null) return null; // acceptance state unknown — stay dark
  const signedAt = acceptedOffers.get(String(c.id));
  if (!signedAt && !isOfferAskStatus(c.status)) return null; // window passed unsigned

  const lenderName = c.lender || c.lender_other || "your lender";
  const offerAmount = Number(c.offer_made);
  // Verify writes fee_percentage alongside the token; tolerate either 28 or 0.28.
  const rawPct = Number(c.fee_percentage) || 0;
  const feePercentage = rawPct > 1 ? Math.round(rawPct) : Math.round(rawPct * 100);
  const feeIncVat = Number(c.fee_total) || 0;
  const net = Number(c.client_payout) || 0;

  return {
    token: c.offer_accept_token,
    caseId: c.id,
    offer: {
      claimId: c.case_number || String(c.id),
      lenderName,
      offerAmount,
      offerDate: iso(c.frl_outcome_verified_at) || iso(c.updated_at) || "",
      // No expiry exists CRM-side — the field is deliberately absent.
      offerReference: c.case_number || String(c.id),
      termsOfAcceptance: buildOfferTerms(lenderName, offerAmount, feePercentage, feeIncVat, net),
      feePercentage,
      estimatedFeeAmount: feeIncVat,
      estimatedNetToClient: net,
      status: signedAt ? "accepted" : "pending",
    },
  };
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
  const [contactRes, casesRes, uploads, acceptedOffers, completedTokens, chases, questionnaireLink, extraLenderLink] = await Promise.all([
    crmQuery(
      `SELECT id_chase_active, id_chase_started_at, identity_status, identity_confirmed_at,
              document_checklist
         FROM public.contacts WHERE id = $1 LIMIT 1`,
      [contactId],
    ),
    crmQuery(
      `SELECT id, case_number, lender, lender_other, status, updated_at,
              offer_made, offer_accept_token, resign_token, fos_referral_token
         FROM public.cases WHERE contact_id = $1`,
      [contactId],
    ),
    getPortalUploads(contactId),
    getAcceptedOffers(contactId),
    getCompletedTrackingTokens(contactId),
    getActiveChaseWorkflows(contactId),
    getQuestionnaireLink(contactId),
    getExtraLenderLink(contactId),
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
      action: "/documents",
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
      action: "/documents",
    });
  }

  // ── Questionnaire + extra-lender (contact-level — Phase 7.3 Slice C) ──
  // Shown only while the chase workflow is live AND the form actually exists
  // (the worker mints the token / sends the first email up to ~48h after
  // arming — never show a card the client can't act on). Done comes from the
  // CRM's own checklist tick — the submit paths set document_checklist and the
  // worker completes the chase from it LATER (its sweep can lag), so the
  // checklist is the immediate authoritative signal, not the workflow status.
  const checklist = (contact && typeof contact.document_checklist === "object" && contact.document_checklist) || {};
  if (chases?.questionnaire && questionnaireLink && checklist.questionnaire !== true) {
    reqs.push({
      id: `questionnaire-${contactId}`,
      kind: "questionnaire",
      title: "Fill in your questionnaire",
      description: "We need a few details from you to progress your claim. It only takes a few minutes.",
      icon: "assignment",
      done: false,
      action: "/dashboard",
    });
  }
  if (chases?.extraLender && extraLenderLink && checklist.extraLender !== true) {
    reqs.push({
      id: `extra-lender-${contactId}`,
      kind: "extra-lender",
      title: "Tell us about other lenders",
      description: "Tell us which other lenders you borrowed from so we can check whether you have further claims.",
      icon: "playlist_add",
      done: false,
      action: "/dashboard",
    });
  }

  // ── FOS referral (per claim — Phase 7.3 Slice C) ──
  // Shown while the case carries an unsigned FOS retainer token; drops once the
  // retainer is completed (per-token tracking check, token never cleared).
  if (completedTokens) {
    for (const k of casesRes.rows) {
      if (!fosArmed(k, completedTokens)) continue;
      if (mapStatus(k.status) === null) continue; // never surface a hidden claim
      const lender = k.lender || k.lender_other || "your lender";
      reqs.push({
        id: `fos-${k.id}`,
        kind: "fos-referral",
        title: `Approve your Ombudsman referral — ${lender}`,
        description: `The lender's response wasn't good enough. Review and approve referring your ${lender} claim to the Financial Ombudsman Service.`,
        icon: "gavel",
        done: false,
        lenderName: lender,
        claimId: String(k.id),
        action: `/claims/${encodeURIComponent(k.case_number || String(k.id))}`,
      });
    }
  }

  // ── Signature / Letter of Authority (per claim — Phase 7.3 Slice B) ──
  // Shown while the case carries a Resend-LOA token that hasn't been signed
  // (per-token tracking check — the token itself is never cleared). Once signed
  // the ask DROPS rather than flipping to done: the token lives forever, so a
  // done-card would too. Skipped when tracking is unreadable.
  if (completedTokens) {
    for (const k of casesRes.rows) {
      if (!signatureArmed(k, completedTokens)) continue;
      if (mapStatus(k.status) === null) continue; // never surface a hidden claim
      const lender = k.lender || k.lender_other || "your lender";
      reqs.push({
        id: `signature-${k.id}`,
        kind: "signature",
        title: `Sign your Letter of Authority — ${lender}`,
        description: `We need an updated signature for your ${lender} claim so we can keep things moving. It only takes a minute.`,
        icon: "stylus_note",
        done: false,
        lenderName: lender,
        claimId: String(k.id),
        action: `/claims/${encodeURIComponent(k.case_number || String(k.id))}`,
      });
    }
  }

  // ── Offer acceptance (per claim / lender — Phase 7.3 Slice A) ──
  // Shown while the offer is armed (token + amount + sendable status); flips to
  // done once the signing record is Completed; disappears once the case moves
  // past the acceptance window. Skipped entirely when acceptance state is
  // unreadable (pre-GRANT window) — never show a legal ask on a guess.
  if (acceptedOffers) {
    for (const k of casesRes.rows) {
      if (!offerArmed(k)) continue;
      if (mapStatus(k.status) === null) continue; // never surface a hidden claim
      const lender = k.lender || k.lender_other || "your lender";
      const signedAt = acceptedOffers.get(String(k.id));
      reqs.push({
        id: `offer-${k.id}`,
        kind: "offer-acceptance",
        title: `Review and accept your offer — ${lender}`,
        description: signedAt
          ? "Accepted — thank you. We'll take it from here and keep you updated."
          : `${lender} has made an offer to settle your claim. Review the details and accept when you're ready.`,
        icon: "handshake",
        done: Boolean(signedAt),
        receivedOn: signedAt || undefined,
        lenderName: lender,
        claimId: String(k.id),
        action: `/claims/${encodeURIComponent(k.case_number || String(k.id))}`,
      });
    }
  }

  return reqs;
}
