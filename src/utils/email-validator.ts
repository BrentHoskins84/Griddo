import validator from 'validator';

/**
 * Sanitizes and validates an email address
 * Returns null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim();
  
  // Validate format
  if (!validator.isEmail(trimmed)) {
    return null;
  }
  
  // Normalize (lowercase, remove dots in Gmail addresses, etc.)
  const normalized = validator.normalizeEmail(trimmed, {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
  });
  
  if (!normalized) {
    return null;
  }
  
  // Check for email header injection attempts (newlines)
  if (/[\r\n]/.test(normalized)) {
    return null;
  }
  
  return normalized;
}