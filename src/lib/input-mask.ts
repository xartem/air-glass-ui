import { devDebug } from "@/lib/debug";

/*
 * Input masks (W5 gap util): light, dependency-free formatters shared by the
 * checkout card fields, the crypto amount inputs and the Forms showcase. Each
 * mask takes the raw user input and returns the display-formatted string; strip
 * with `unmask()` before submitting. Logs at the format boundary (dev-only).
 */

export type MaskKind = "card" | "expiry" | "phone" | "amount";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Card number → groups of 4, up to 19 digits: "4242 4242 4242 4242". */
function maskCard(value: string): string {
  return digits(value)
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/** Expiry → "MM/YY". */
function maskExpiry(value: string): string {
  const d = digits(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

/** US-style phone → "(123) 456-7890"; falls back to raw digits while typing. */
function maskPhone(value: string): string {
  const d = digits(value).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Crypto/decimal amount → grouped integer part + up to 8 decimals: "1,234.5678". */
function maskAmount(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [intPart = "", ...rest] = cleaned.split(".");
  const decimals = rest.join("").slice(0, 8);
  const grouped = intPart.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const hasDot = cleaned.includes(".");
  return hasDot ? `${grouped || "0"}.${decimals}` : grouped;
}

const MASKS: Record<MaskKind, (value: string) => string> = {
  card: maskCard,
  expiry: maskExpiry,
  phone: maskPhone,
  amount: maskAmount,
};

/** Format raw input for the given mask. */
export function applyMask(kind: MaskKind, raw: string): string {
  const formatted = MASKS[kind](raw);
  devDebug("[mask] apply", { kind, formatted });
  return formatted;
}

/** Strip mask formatting back to the significant characters. */
export function unmask(kind: MaskKind, value: string): string {
  return kind === "amount" ? value.replace(/,/g, "") : digits(value);
}

/** Suggested inputMode for a masked field (mobile keypad hint). */
export function maskInputMode(kind: MaskKind): "numeric" | "decimal" | "tel" {
  if (kind === "amount") return "decimal";
  if (kind === "phone") return "tel";
  return "numeric";
}
