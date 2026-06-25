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

/** Default first-time password = DOB as DDMMYYYY (e.g. 15 Jan 2002 → "15012002").
 *  Used to let any CRM client log in with email + DOB before they set their own. */
export function defaultPasswordFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}${mm}${d.getUTCFullYear()}`;
}

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

/** Server-side DOB guard — mirrors the client rule (18+, not future, <120y). */
export function dobError(value) {
  if (!value) return "Date of birth is required.";
  const dob = new Date(value + "T00:00:00");
  if (Number.isNaN(dob.getTime())) return "Invalid date of birth.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return "Date of birth cannot be in the future.";
  let age = today.getFullYear() - dob.getFullYear();
  const before =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (before) age -= 1;
  if (age < 18) return "You must be 18 or older to register.";
  if (age > 120) return "Please check your date of birth.";
  return null;
}
