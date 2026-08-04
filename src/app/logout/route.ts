import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Sign out. POST, so a stray link or a prefetch cannot end a session.
 */
export async function POST() {
  redirect(await signOut());
}
