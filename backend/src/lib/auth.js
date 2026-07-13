import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export const hashPassword = (plain) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Scoped tokens: "signup" carries a verified email through the signup steps;
// "session" is the logged-in token; "reset" authorises a password reset.
export const signToken = (payload, expiresIn) => jwt.sign(payload, SECRET, { expiresIn });
export function verifyToken(token, expectedScope) {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (expectedScope && decoded.scope !== expectedScope) return null;
    return decoded;
  } catch {
    return null;
  }
}

export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/** Map a DB user row to the AuthUser shape the frontend expects. */
export function toAuthUser(row) {
  const parts = String(row.full_name).trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  const digits = String(row.phone).replace(/\D/g, "");
  return {
    clientId: row.client_id ?? "",
    firstName,
    lastName,
    email: row.email,
    phoneLastFour: digits.slice(-4),
  };
}

/** Normalise a UK phone number to E.164 (+44XXXXXXXXXX), or null if it isn't a
 *  valid 10-digit UK number. Accepts 07…, +44…, 0044…, or a bare 10-digit NSN.
 *  ("10 digits" = the UK national significant number, i.e. without the leading 0.) */
export function normalizePhoneUK(value) {
  if (value == null) return null;
  let d = String(value).replace(/\D/g, "").replace(/^00/, "");
  let nsn;
  if (d.length === 12 && d.startsWith("44")) nsn = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) nsn = d.slice(1);
  else if (d.length === 10) nsn = d;
  else return null;
  return /^\d{10}$/.test(nsn) ? "+44" + nsn : null;
}

/** Phone guard — UK firm: must resolve to exactly 10 significant digits. */
export function phoneError(value) {
  if (!value || !String(value).trim()) return "Please enter your phone number.";
  if (!normalizePhoneUK(value)) {
    return "Please enter a valid UK mobile number — 10 digits, like 07123 456789.";
  }
  return null;
}

/** Parse a DOB (Date or YYYY-MM-DD string) to a midnight Date, or null. */
function parseDob(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (!value) return null;
  const d = new Date(String(value).slice(0, 10) + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Exact age in whole years as of today, or null if the DOB can't be parsed. */
export function ageFrom(value) {
  const dob = parseDob(value);
  if (!dob) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let age = today.getFullYear() - dob.getFullYear();
  const before =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (before) age -= 1;
  return age;
}

/** Server-side DOB guard — mirrors the client rule (18+, not future, <120y). */
export function dobError(value) {
  if (!value) return "Date of birth is required.";
  const dob = parseDob(value);
  if (!dob) return "Invalid date of birth.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return "Date of birth cannot be in the future.";
  const age = ageFrom(value);
  if (age < 18) return "You must be 18 or older to use the portal.";
  if (age > 120) return "Please check your date of birth.";
  return null;
}
