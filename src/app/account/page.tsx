import Link from "next/link";
import { authConfigured, currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account" };

/**
 * Who you are signed in as.
 *
 * Also the pattern for gating anything else: read currentUser, and send a
 * visitor to /login with `next` set to where they were trying to go.
 */
export default async function AccountPage() {
  const user = await currentUser();

  if (!authConfigured) {
    return (
      <section className="section">
        <div className="shell max-w-prose">
          <h1 className="text-2xl font-semibold tracking-tight">Sign-in is not configured</h1>
          <p className="mt-2 text-muted">
            Set <code>TINTORCH_ISSUER</code> and <code>TINTORCH_CLIENT_ID</code>, then restart.
          </p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section">
        <div className="shell max-w-prose">
          <h1 className="text-2xl font-semibold tracking-tight">You are signed out</h1>
          <p className="mt-2 text-muted">Sign in with your TinTorch account to continue.</p>
          <Link
            href="/login?next=/account"
            className="mt-4 inline-block underline underline-offset-2"
          >
            Sign in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="shell max-w-prose">
        <h1 className="text-2xl font-semibold tracking-tight">{user.name || user.email}</h1>
        {user.email && <p className="mt-1 text-muted">{user.email}</p>}

        {user.organizations.length > 0 && (
          <>
            <h2 className="mt-8 text-lg font-semibold">Workspaces</h2>
            <ul className="mt-2 space-y-1">
              {user.organizations.map((org) => (
                <li key={org.id}>
                  {org.name} <span className="text-muted">· {org.role.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* POST, so nothing can sign someone out by linking to it. */}
        <form action="/logout" method="post" className="mt-8">
          <button type="submit" className="underline underline-offset-2">
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
