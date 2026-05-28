import { Router } from "express";
import { query } from "../db.js";
import {
  hashPassword, verifyPassword, signToken, verifyToken,
  generateOtp, toAuthUser, dobError,
} from "../lib/auth.js";

export const authRouter = Router();

const OTP_TTL_MIN = Number(process.env.OTP_TTL_MINUTES || 5);
const EXPOSE_OTP = process.env.EXPOSE_OTP === "true";
const MAX_OTP_ATTEMPTS = 5;

const normEmail = (e) => String(e || "").trim().toLowerCase();
const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function passwordError(pw) {
  if (typeof pw !== "string" || pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must include a number.";
  return null;
}

async function findUserByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] ?? null;
}

// Step 1 — client enters their email; we generate + "send" a 6-digit code.
authRouter.post("/register-start", async (req, res) => {
  const email = normEmail(req.body?.email);
  if (!emailValid(email)) return res.json({ sent: false, message: "Please enter a valid email address." });

  if (await findUserByEmail(email)) {
    return res.json({ sent: false, alreadyExists: true, message: "An account already exists for this email. Please log in." });
  }

  // Supersede any prior pending codes, then issue a fresh one.
  await query("UPDATE email_verifications SET consumed = true WHERE email = $1 AND consumed = false", [email]);
  const code = generateOtp();
  await query(
    "INSERT INTO email_verifications (email, code, expires_at) VALUES ($1, $2, now() + ($3 || ' minutes')::interval)",
    [email, code, String(OTP_TTL_MIN)],
  );
  console.log(`[otp] register code for ${email}: ${code}`);
  res.json({ sent: true, message: "Verification code sent to your email.", ...(EXPOSE_OTP ? { devCode: code } : {}) });
});

authRouter.post("/resend-otp", async (req, res) => {
  const email = normEmail(req.body?.email);
  if (!emailValid(email)) return res.json({ sent: false, message: "Please enter a valid email address." });
  await query("UPDATE email_verifications SET consumed = true WHERE email = $1 AND consumed = false", [email]);
  const code = generateOtp();
  await query(
    "INSERT INTO email_verifications (email, code, expires_at) VALUES ($1, $2, now() + ($3 || ' minutes')::interval)",
    [email, code, String(OTP_TTL_MIN)],
  );
  console.log(`[otp] resend code for ${email}: ${code}`);
  res.json({ sent: true, message: "New code sent.", ...(EXPOSE_OTP ? { devCode: code } : {}) });
});

// Step 2 — verify the code; on success return a short-lived signup token.
authRouter.post("/verify-otp", async (req, res) => {
  const email = normEmail(req.body?.email);
  const otp = String(req.body?.otp || "").trim();

  const { rows } = await query(
    `SELECT * FROM email_verifications
      WHERE email = $1 AND consumed = false AND expires_at > now()
      ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  const v = rows[0];
  if (!v) {
    return res.json({ verified: false, attemptsRemaining: 0, token: "", message: "Your code has expired. Please request a new one." });
  }

  if (otp === v.code) {
    await query("UPDATE email_verifications SET consumed = true WHERE id = $1", [v.id]);
    const token = signToken({ scope: "signup", email }, "30m");
    return res.json({ verified: true, attemptsRemaining: 0, token, message: "Identity verified." });
  }

  const attempts = v.attempts + 1;
  if (attempts >= MAX_OTP_ATTEMPTS) {
    await query("UPDATE email_verifications SET consumed = true, attempts = $2 WHERE id = $1", [v.id, attempts]);
    return res.json({ verified: false, attemptsRemaining: 0, token: "", message: "Too many incorrect attempts. Please request a new code." });
  }
  await query("UPDATE email_verifications SET attempts = $2 WHERE id = $1", [v.id, attempts]);
  const remaining = MAX_OTP_ATTEMPTS - attempts;
  res.json({ verified: false, attemptsRemaining: remaining, token: "", message: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` });
});

// Step 4 — with the signup token + password + profile, create the account and
// return a session token (the client is logged in immediately).
authRouter.post("/complete-registration", async (req, res) => {
  const { signupToken, password, fullName, phone, dob } = req.body ?? {};
  const decoded = verifyToken(signupToken, "signup");
  if (!decoded) return res.json({ success: false, token: "", user: null, message: "Your session expired. Please start again." });
  const email = normEmail(decoded.email);

  const pwErr = passwordError(password);
  if (pwErr) return res.json({ success: false, token: "", user: null, message: pwErr });
  if (!fullName || String(fullName).trim().length < 2) return res.json({ success: false, token: "", user: null, message: "Please enter your full name." });
  if (!phone || String(phone).replace(/\D/g, "").length < 7) return res.json({ success: false, token: "", user: null, message: "Please enter a valid phone number." });
  const dErr = dobError(dob);
  if (dErr) return res.json({ success: false, token: "", user: null, message: dErr });

  if (await findUserByEmail(email)) {
    return res.json({ success: false, token: "", user: null, message: "An account already exists for this email. Please log in." });
  }

  const hash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, full_name, phone, dob)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [email, hash, String(fullName).trim(), String(phone).trim(), dob],
  );
  const user = toAuthUser(rows[0]);
  const token = signToken({ scope: "session", sub: rows[0].id }, "2h");
  res.json({ success: true, token, user, message: "Account created successfully." });
});

authRouter.post("/login", async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.json({ success: false, token: "", user: null, message: "Invalid email or password." });
  }
  const token = signToken({ scope: "session", sub: user.id }, "2h");
  res.json({ success: true, token, user: toAuthUser(user), message: "Login successful." });
});

// Password reset (basic). Never reveal whether an email is registered.
authRouter.post("/request-reset", async (req, res) => {
  const email = normEmail(req.body?.email);
  const user = await findUserByEmail(email);
  let devToken;
  if (user) {
    devToken = signToken({ scope: "reset", email }, "30m");
    console.log(`[reset] token for ${email}: ${devToken}`);
  }
  res.json({ success: true, message: "If an account with that email exists, we have sent a password reset link.", ...(EXPOSE_OTP && devToken ? { devToken } : {}) });
});

authRouter.post("/set-new-password", async (req, res) => {
  const { token, newPassword } = req.body ?? {};
  const decoded = verifyToken(token, "reset");
  if (!decoded) return res.json({ success: false, message: "This reset link is invalid or has expired." });
  const pwErr = passwordError(newPassword);
  if (pwErr) return res.json({ success: false, message: pwErr });
  const email = normEmail(decoded.email);
  const hash = await hashPassword(newPassword);
  const { rowCount } = await query("UPDATE users SET password_hash = $1, updated_at = now() WHERE email = $2", [hash, email]);
  if (rowCount === 0) return res.json({ success: false, message: "Account not found." });
  res.json({ success: true, message: "Password reset successfully." });
});
