import "server-only";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { cache } from "react";

/**
 * Sign-in through TinTorch Account.
 *
 * A confidential client: the secret authenticates this app at the token
 * endpoint, so a stolen authorization code is worth nothing to anyone who does
 * not also hold it. PKCE is kept alongside it rather than instead of it - the
 * code verifier binds the redemption to the browser that began the exchange,
 * which the secret alone does not do, and it is what protects the flow if a
 * code ever leaks through a referrer or a log.
 *
 * The secret is read on the server only. It has no NEXT_PUBLIC_ prefix, and
 * nothing in this file is imported by a client component - `server-only` at the
 * top turns any such import into a build error rather than a leak.
 *
 * There is no session secret, because there is no session of our own. The ID
 * token the issuer signs *is* the session: held in an httpOnly cookie, its
 * signature checked against the issuer's JWKS on every read.
 */

const ISSUER = (process.env.TINTORCH_ISSUER ?? "").replace(/\/+$/, "");
const CLIENT_ID = process.env.TINTORCH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.TINTORCH_CLIENT_SECRET ?? "";

export const authConfigured = Boolean(ISSUER && CLIENT_ID && CLIENT_SECRET);

/** Cookie names. `__Host-` binds them to this exact origin and path. */
const SESSION = "__Host-punya_session";
const PENDING = "__Host-punya_pending";

const SCOPES = "openid profile email organizations";

type Discovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
};

/**
 * The issuer's own description of itself.
 *
 * Fetched rather than hardcoded so a moved endpoint does not need a release,
 * and cached for a day: these change about never, and an outage on this call
 * would take sign-in down with it.
 */
export const discover = cache(async (): Promise<Discovery | null> => {
  if (!authConfigured) return null;
  try {
    const response = await fetch(`${ISSUER}/.well-known/openid-configuration`, {
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      console.error(`[auth] discovery ${response.status}`);
      return null;
    }
    return (await response.json()) as Discovery;
  } catch (error) {
    console.error("[auth] discovery failed", error);
    return null;
  }
});

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
async function keys() {
  const config = await discover();
  if (!config) return null;
  // Built once: the set caches keys and refetches on an unknown kid, so a key
  // rotation is picked up without a restart.
  jwks ??= createRemoteJWKSet(new URL(config.jwks_uri));
  return jwks;
}

export type User = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  organizations: { id: string; slug: string; name: string; role: string }[];
};

function toUser(claims: JWTPayload): User {
  const organizations = Array.isArray(claims.organizations)
    ? (claims.organizations as User["organizations"])
    : [];

  return {
    id: String(claims.sub ?? ""),
    name: String(claims.name ?? claims.preferred_username ?? ""),
    email: String(claims.email ?? ""),
    picture: typeof claims.picture === "string" ? claims.picture : undefined,
    organizations,
  };
}

/**
 * Who is signed in, or nobody.
 *
 * Verified on every call rather than trusted: the cookie is a token from
 * another system, so its signature, issuer, audience and expiry are all
 * checked. An expired or tampered token reads as signed out.
 */
export const currentUser = cache(async (): Promise<User | null> => {
  if (!authConfigured) return null;

  const token = (await cookies()).get(SESSION)?.value;
  if (!token) return null;

  const keySet = await keys();
  if (!keySet) return null;

  try {
    const { payload } = await jwtVerify(token, keySet, {
      issuer: ISSUER,
      audience: CLIENT_ID,
    });
    return toUser(payload);
  } catch {
    // Expired, wrong audience, bad signature - all the same to a reader.
    return null;
  }
});

/* ── The handshake ──────────────────────────────────────────────────────── */

const base64url = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString("base64url");

const randomString = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

/** What the callback needs to finish, held between the two requests. */
type Pending = { state: string; verifier: string; nonce: string; next: string };

/**
 * Only a path on this site.
 *
 * The post-login destination arrives in a query string, so without this it is
 * an open redirect: a link to /login?next=https://elsewhere would bounce a
 * signed-in visitor off the site carrying their trust with them.
 */
export function safeNext(value: string | null): string {
  if (!value) return "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** Begin sign-in: returns the URL to send the visitor to. */
export async function beginSignIn(next: string): Promise<string | null> {
  const config = await discover();
  if (!config) return null;

  const pending: Pending = {
    state: randomString(),
    verifier: randomString(),
    nonce: randomString(),
    next: safeNext(next),
  };

  (await cookies()).set(PENDING, JSON.stringify(pending), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = new URL(config.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", pending.state);
  url.searchParams.set("nonce", pending.nonce);
  url.searchParams.set("code_challenge", await challengeFor(pending.verifier));
  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
}

export function redirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  return `${base}/auth/callback`;
}

/**
 * Finish sign-in.
 *
 * Returns where to send the visitor. The pending cookie is cleared whatever
 * happens, so a code and a state can each be used once.
 */
export async function completeSignIn(
  code: string | null,
  state: string | null,
): Promise<{ ok: boolean; next: string }> {
  const jar = await cookies();
  const raw = jar.get(PENDING)?.value;
  jar.delete(PENDING);

  const config = await discover();
  if (!config || !code || !raw) return { ok: false, next: "/" };

  let pending: Pending;
  try {
    pending = JSON.parse(raw) as Pending;
  } catch {
    return { ok: false, next: "/" };
  }

  // The state ties this callback to the request that started it. Without the
  // check, someone else's code could be planted in a visitor's browser.
  if (!state || state !== pending.state) return { ok: false, next: "/" };

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    client_id: CLIENT_ID,
    code_verifier: pending.verifier,
  });

  let idToken: string;
  try {
    const response = await fetch(config.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        /*
         * client_secret_basic. Sent as a header rather than in the body so the
         * secret does not end up in anything that logs a request body, and it
         * is the method the spec asks a server to support first.
         */
        Authorization: `Basic ${Buffer.from(
          `${encodeURIComponent(CLIENT_ID)}:${encodeURIComponent(CLIENT_SECRET)}`,
        ).toString("base64")}`,
      },
      body,
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[auth] token exchange ${response.status}`);
      return { ok: false, next: pending.next };
    }
    const token = (await response.json()) as { id_token?: string; expires_in?: number };
    if (!token.id_token) return { ok: false, next: pending.next };
    idToken = token.id_token;
  } catch (error) {
    console.error("[auth] token exchange failed", error);
    return { ok: false, next: pending.next };
  }

  const keySet = await keys();
  if (!keySet) return { ok: false, next: pending.next };

  let expiresAt: number;
  try {
    const { payload } = await jwtVerify(idToken, keySet, {
      issuer: ISSUER,
      audience: CLIENT_ID,
    });
    // The nonce ties the token to this browser's request, which is what stops
    // a token minted for someone else being replayed here.
    if (payload.nonce !== pending.nonce) return { ok: false, next: pending.next };
    expiresAt = typeof payload.exp === "number" ? payload.exp : 0;
  } catch (error) {
    console.error("[auth] id_token rejected", error);
    return { ok: false, next: pending.next };
  }

  jar.set(SESSION, idToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // The cookie outlives nothing: it goes when the token it holds does.
    expires: expiresAt ? new Date(expiresAt * 1000) : undefined,
  });

  return { ok: true, next: pending.next };
}

/** Sign out here, and at the issuer where it offers a way. */
export async function signOut(): Promise<string> {
  const jar = await cookies();
  jar.delete(SESSION);

  const config = await discover();
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  if (!config?.end_session_endpoint) return "/";

  const url = new URL(config.end_session_endpoint);
  url.searchParams.set("client_id", CLIENT_ID);
  if (base) url.searchParams.set("post_logout_redirect_uri", base);
  return url.toString();
}
