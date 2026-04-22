import { redirect } from "next/navigation";

/**
 * /employer/wallet → /employer/escrow
 * Keeps URL naming consistent: talent has /talent/wallet, employer has /employer/escrow.
 * This redirect ensures any existing links or bookmarks don't 404.
 */
export default function EmployerWalletRedirect() {
  redirect("/employer/escrow");
}
