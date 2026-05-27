/**
 * Form validation utilities for the auth flow. Each validator returns `null`
 * when the value is acceptable, or a plain-English error message otherwise.
 * Messages are written for a non-technical, 18–90+ audience (brief §2).
 */

// Letters (incl. accents), spaces, hyphens and apostrophes — e.g. "O'Brien", "Mary-Jane".
const NAME_RE = /^[\p{L}][\p{L}\s'-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter your name.";
  if (v.length < 2) return "Please enter at least 2 characters.";
  if (!NAME_RE.test(v)) return "Please use letters, spaces, hyphens or apostrophes only.";
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Please enter your email address.";
  if (!EMAIL_RE.test(v)) return "Please enter a valid email address, like name@example.com.";
  return null;
}

export function validateDateOfBirth(value: string): string | null {
  if (!value) return "Please enter your date of birth.";
  const dob = new Date(value + "T00:00:00");
  if (Number.isNaN(dob.getTime())) return "Please enter a valid date.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return "Date of birth cannot be in the future.";

  // Exact age in years as of today.
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;

  if (age < 18) return "You must be 18 or older to register.";
  if (age > 120) return "Please check your date of birth.";
  return null;
}

export interface PasswordChecks {
  isValid: boolean;
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export function validatePassword(value: string): PasswordChecks {
  const minLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  return {
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    isValid: minLength && hasUppercase && hasLowercase && hasNumber,
  };
}

/** Count of met requirements — drives the strength meter (0–4). */
export function passwordStrength(value: string): number {
  const c = validatePassword(value);
  return [c.minLength, c.hasUppercase, c.hasLowercase, c.hasNumber].filter(Boolean).length;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return "Please re-enter your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}
