/**
 * Sanitizes user input to prevent XSS attacks.
 * Escapes HTML special characters and removes potentially dangerous content.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

/**
 * Validates and sanitizes search input.
 * Returns sanitized string or empty string if input is invalid.
 */
export function sanitizeSearchInput(input: string): string {
  if (!input) return "";

  // Remove any HTML/script tags
  const cleaned = input.replace(/<[^>]*>/g, "");

  // Escape special characters
  return sanitizeInput(cleaned);
}
