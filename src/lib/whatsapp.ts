/**
 * Normalizes a Saudi phone number to the digits-only international format
 * WhatsApp deep links require (966XXXXXXXXX, no leading +/0). Accepts the
 * three formats real users actually type: 05XXXXXXXX, +9665XXXXXXXX,
 * 9665XXXXXXXX. Returns null (never throws, never blindly concatenates)
 * for anything that doesn't match a valid Saudi mobile shape.
 */
export function normalizeSaudiPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");

  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  if (/^5\d{8}$/.test(digits)) return `966${digits}`;

  return null;
}

/** Builds a wa.me deep link with a URL-encoded prefilled message. Returns
 * null if the phone number can't be normalized, so callers never render a
 * broken WhatsApp button. */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizeSaudiPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
