/**
 * Builds a WhatsApp deep link URL.
 * - On mobile: opens the WhatsApp app directly.
 * - On desktop: opens web.whatsapp.com.
 * 
 * @param phone The phone number (any format — digits will be extracted)
 * @param message Pre-filled message text
 * @returns A wa.me deep link URL, or null if no phone number provided
 */
export function buildWhatsAppUrl(phone: string | undefined | null, message: string): string | null {
  if (!phone) return null;

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Handle South African numbers: if starts with 0, replace with country code 27
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "27" + digits.slice(1);
  }

  // Must have at least 10 digits to be a valid number
  if (digits.length < 10) return null;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encodedMessage}`;
}

/**
 * Builds the default intro message an employer sends to a Maker.
 */
export function buildMakerMessage(makerName: string, proofTitle?: string): string {
  if (proofTitle && proofTitle !== "placeholder_url" && proofTitle !== "Latest Project Showcase") {
    return `Hi ${makerName}! I saw your proof video "${proofTitle}" on FutureWay and I'd love to discuss a project with you. Are you available?`;
  }
  return `Hi ${makerName}! I found your profile on FutureWay and I'd love to discuss a project with you. Are you available?`;
}
