import { redirect } from "next/navigation";
import { authConfigured, beginSignIn, safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Start sign-in. The only way in - there is no password to get wrong here,
 * because there is no password here.
 */
export async function GET(request: Request) {
  if (!authConfigured) {
    return new Response(
      "Sign-in is not configured: set TINTORCH_ISSUER and TINTORCH_CLIENT_ID.",
      { status: 501, headers: { "Content-Type": "text/plain" } },
    );
  }

  const next = safeNext(new URL(request.url).searchParams.get("next"));
  const authorize = await beginSignIn(next);
  if (!authorize) {
    return new Response("Could not reach the sign-in service. Try again shortly.", {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }

  redirect(authorize);
}
