import "server-only";

/**
 * Taking a payment, from the server's side.
 *
 * The delivery key is what says which workspace a payment belongs to, so it
 * stays here and never reaches a browser. The page asks this site, this site
 * asks the CMS, the CMS asks TinTorch Account, and Account is the only one
 * holding a merchant secret.
 *
 * Amounts are in paise throughout, the same as every gateway's own API,
 * because rupees-with-a-decimal is how rounding errors become money.
 */

const BASE = process.env.TINTORCH_CMS_URL ?? "";
const KEY = process.env.TINTORCH_CMS_KEY ?? "";

/** A gift below this is not worth a gateway fee; above it, ask the Trust. */
export const MIN_PAISE = 1_000; // Rs 10
export const MAX_PAISE = 20_000_000; // Rs 2,00,000

export type Order = {
  id: string;
  provider: "RAZORPAY" | "STRIPE" | "CASHFREE";
  amount: number;
  currency: string;
  public_key: string;
  client_token: string | null;
  live: boolean;
};

export type Failure = { error: string; status: number };

async function call(path: string, init: RequestInit = {}): Promise<unknown | Failure> {
  if (!BASE || !KEY) return { error: "Online payment is not configured.", status: 503 };

  try {
    const response = await fetch(`${BASE}/api/v1/content${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const json = (await response.json().catch(() => null)) as
      | { data?: unknown; error?: { message?: string } }
      | null;

    if (!response.ok) {
      /*
       * The CMS now answers 422 with the gateway's own sentence where a
       * gateway refused, so there is something worth passing on. Its status
       * travels too: a 503 is worth trying again, a 422 is not.
       */
      return {
        error: json?.error?.message ?? `The payment could not be started (${response.status}).`,
        status: response.status,
      };
    }
    return json?.data ?? {};
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause.message : "The payment service did not answer.",
      status: 503,
    };
  }
}

/** The gateways this site can currently take money with. Empty means none. */
export async function payableBy(): Promise<Order["provider"][]> {
  const result = await call("/checkout");
  if (!Array.isArray(result)) return [];
  return result
    .map((row) => (row as { provider?: string }).provider)
    .filter((provider): provider is Order["provider"] =>
      provider === "RAZORPAY" || provider === "STRIPE" || provider === "CASHFREE",
    );
}

/**
 * What a named seva costs, read from the CMS rather than from the browser.
 *
 * A page that posts its own amount for a named seva is a page where anyone
 * can pay one rupee for a year's cow sponsorship and get the receipt for it.
 * So the slug travels and the price is looked up here.
 */
export async function sevaPrice(
  slug: string,
): Promise<{ title: string; amountPaise: number } | null> {
  const result = await call(`/product/${encodeURIComponent(slug)}?fields=price,currency,title`);
  if (!result || typeof result !== "object" || "error" in result) return null;

  const item = result as { title?: string; fields?: Record<string, unknown> };
  const rupees = Number(item.fields?.price);
  if (!Number.isFinite(rupees) || rupees <= 0) return null;

  return {
    title: typeof item.title === "string" && item.title ? item.title : slug,
    amountPaise: Math.round(rupees * 100),
  };
}

export async function createOrder(input: {
  amountPaise: number;
  purpose: string;
  referenceId: string;
  name?: string;
  email?: string;
  phone?: string;
  returnUrl?: string;
}): Promise<Order | Failure> {
  const providers = await payableBy();
  const provider = providers[0];
  if (!provider) {
    // Refuse rather than guess. A donate button that silently picks a gateway
    // nobody switched on is worse than one that says it cannot take the money.
    return { error: "No payment method is switched on for this site.", status: 503 };
  }

  const result = await call("/checkout", {
    method: "POST",
    body: JSON.stringify({
      provider,
      amount: input.amountPaise,
      currency: "INR",
      purpose: input.purpose,
      reference_id: input.referenceId,
      customer_name: input.name,
      customer_email: input.email,
      customer_phone: input.phone,
      return_url: input.returnUrl,
    }),
  });

  if (result && typeof result === "object" && "error" in result) return result as Failure;
  return result as Order;
}

export async function orderStatus(
  id: string,
): Promise<{ status: string; amount: number; currency: string } | Failure> {
  const result = await call(`/checkout/${encodeURIComponent(id)}`);
  if (result && typeof result === "object" && "error" in result) return result as Failure;
  return result as { status: string; amount: number; currency: string };
}
