/**
 * Utility to mask potential South African phone numbers in text strings.
 * Filters common SA formats: 072..., +27..., 27..., etc.
 */
export function maskPhoneNumbers(text: string): string {
  // Regex for SA phone numbers (simplified for common patterns)
  // Matches: 071 234 5678, +27721234567, 27 72 123 4567, 0721234567
  const saPhoneRegex = /(\+27|27|0)[ ]?[6-8][0-9]([ ]?[0-9]){7}/g;
  
  return text.replace(saPhoneRegex, (match) => {
    // Keep first 3 chars, mask the rest
    return match.substring(0, 3) + "****" + match.substring(match.length - 2);
  });
}
