import { ProfileRole } from "./database.types";

/**
 * Formats a ProfileRole into a beautiful South African human-readable label.
 */
export function formatProfileRole(role: string | null | undefined): string {
  if (!role) return "Hustler";
  
  const roles: Record<string, string> = {
    hustler: "Self-Taught Hustler",
    freshie: "Fresh Talent",
    graduate: "Degree Graduate",
    reskiller: "Career Reskiller",
    employer: "Verified Employer",
    admin: "Platform Admin"
  };

  return roles[role.toLowerCase()] || "Hustler";
}

/**
 * Returns a CSS class or color definition for a role badge.
 */
export function getRoleTheme(role: string | null | undefined) {
  const r = role?.toLowerCase();
  
  if (r === 'graduate') return {
    bg: 'bg-indigo-500',
    text: 'text-white',
    border: 'border-indigo-600',
    glow: 'shadow-indigo-500/20',
    lightBg: 'bg-indigo-50',
    lightText: 'text-indigo-600'
  };

  if (r === 'reskiller') return {
    bg: 'bg-amber-500',
    text: 'text-white',
    border: 'border-amber-600',
    glow: 'shadow-amber-500/20',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-600'
  };

  if (r === 'freshie') return {
    bg: 'bg-[#13EC6A]',
    text: 'text-[#052210]',
    border: 'border-[#10B981]',
    glow: 'shadow-[#13EC6A]/20',
    lightBg: 'bg-[#13EC6A]/10',
    lightText: 'text-[#0F766E]'
  };

  // Default: Hustler
  return {
    bg: 'bg-[#0F766E]',
    text: 'text-white',
    border: 'border-[#0D9488]',
    glow: 'shadow-[#0F766E]/20',
    lightBg: 'bg-[#F0FDFA]',
    lightText: 'text-[#0F766E]'
  };
}
