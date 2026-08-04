import { redirect } from "next/navigation";
import { completeSignIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Where the issuer sends the visitor back.
 *
 * Everything that decides whether this is a real sign-in - the state, the code
 * verifier, the token's signature and its nonce - is checked in completeSignIn.
 * A failure lands the visitor back where they started rather than on an error
 * page: it is nearly always a stale tab or a second click on an old link.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  // The issuer refuses by redirecting here with an error rather than a code.
  const denied = params.get("error");
  const { ok, next } = denied
    ? { ok: false, next: "/" }
    : await completeSignIn(params.get("code"), params.get("state"));

  redirect(ok ? next : `/?signin=failed`);
}
