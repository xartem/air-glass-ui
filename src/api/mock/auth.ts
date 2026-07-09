import { ApiError, ValidationError } from "../client";
import type { CreatePasswordPayload, RegisterPayload } from "../types";
import { devDebug } from "../../lib/debug";

/*
 * Guest/anonymous auth extensions for the W1 auth screens (sign-up, first-time
 * password, standalone 2-step verify) plus the lock-screen re-auth. Demo-only:
 * nothing persists. A couple of sentinel inputs exercise the error states so
 * the screens can be reviewed end-to-end on mock data:
 *   register  → "taken@example.com" returns the email-taken validation error
 *   verifyOtp → the demo code is "123456"; anything else is rejected
 *   reauth    → the account password is "password"
 */

/** Demo one-time code accepted by the standalone verification screen. */
export const DEMO_OTP_CODE = "123456";

export function registerAccount(payload: RegisterPayload): { ok: true } {
  devDebug("[mock:auth] register", { email: payload.email });
  if (payload.email?.toLowerCase().trim() === "taken@example.com") {
    throw new ValidationError("Email already registered", {
      email: "email_taken",
    });
  }
  return { ok: true };
}

export function createPassword(payload: CreatePasswordPayload): { ok: true } {
  devDebug("[mock:auth] createPassword");
  if (payload.token === "expired" || payload.token === "used") {
    throw new ApiError(410, "Token invalid", "invalid_token");
  }
  return { ok: true };
}

export function verifyOtp(code: string): { ok: true } {
  devDebug("[mock:auth] verifyOtp");
  if (String(code ?? "").trim() !== DEMO_OTP_CODE) {
    throw new ValidationError("Validation failed", { code: "invalid_code" });
  }
  return { ok: true };
}

export function reauth(password: string): { ok: true } {
  devDebug("[mock:auth] reauth");
  if (password !== "password") {
    throw new ValidationError("Invalid credentials", {
      password: "invalid_credentials",
    });
  }
  return { ok: true };
}
