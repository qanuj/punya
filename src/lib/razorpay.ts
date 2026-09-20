import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Taking a donation, through Razorpay payment links.
 *
 * A link rather than an embedded checkout: the trust's own page collects who
 * is giving and how much, the server asks Razorpay for a link at exactly that
 * amount, and the donor finishes on Razorpay's page. The amount is therefore
 * fixed on this side of the wire - a checkout that takes its amount from the
 * browser is a checkout a visitor can edit.
 *
 * Both keys are server-only. Nothing here has a NEXT_PUBLIC_ prefix and
 * nothing here runs in the browser.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const API = "https://api.razorpay.com/v1";

/** Whether this deployment can take money at all. */
export const razorpayConfigured = Boolean(KEY_ID && KEY_SECRET);

/**
 * What a donation may be.
 *
 * The floor keeps the payment fee from swallowing the gift; the ceiling is
 * Razorpay's own limit on a payment link, and a donor with more to give is
 * better served by a conversation than by a form.
 */
export const MIN_RUPEES = 51;
export const MAX_RUPEES = 500000;

export type PaymentLink = { id: string; url: string };

export type Donor = { name: string; email: string; phone?: string };

/**
 * A link for one donation.
 *
 * `reference_id` is ours and comes back in the callback, so the signature
 * covers something this site chose. Razorpay's own notifications are off:
 * the donor is standing in front of the page, and the thank-you page is the
 * receipt.
 */
export async function createPaymentLink({
  rupees,
  donor,
  description,
  callbackUrl,
  notes,
}: {
  rupees: number;
  donor: Donor;
  description: string;
  callbackUrl: string;
  notes?: Record<string, string>;
}): Promise<PaymentLink> {
  if (!razorpayConfigured) throw new Error("[razorpay] no keys configured");

  const response = await fetch(`${API}/payment_links`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(rupees * 100),
      currency: "INR",
      accept_partial: false,
      description: description.slice(0, 2048),
      reference_id: `punya-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      customer: {
        name: donor.name,
        email: donor.email,
        ...(donor.phone ? { contact: donor.phone } : {}),
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
      callback_url: callbackUrl,
      callback_method: "get",
      ...(notes && Object.keys(notes).length ? { notes } : {}),
    }),
    cache: "no-store",
  });

  const body = (await response.json()) as {
    id?: string;
    short_url?: string;
    error?: { description?: string };
  };

  if (!response.ok || !body.short_url || !body.id) {
    throw new Error(`[razorpay] ${response.status} ${body.error?.description ?? "no link"}`);
  }

  return { id: body.id, url: body.short_url };
}

/**
 * One payment link, read back from Razorpay.
 *
 * The callback carries Razorpay's own parameters and nothing else, so this is
 * how the thank-you page learns who gave and how much. The alternative is
 * putting the donor's name and email in the callback URL, which would publish
 * them to anything that sees a link: a browser history, a referrer header, a
 * server log.
 */
export async function fetchPaymentLink(id: string): Promise<{
  amountPaidRupees: number;
  status: string;
  notes: Record<string, string>;
} | null> {
  if (!razorpayConfigured || !id) return null;

  try {
    const response = await fetch(`${API}/payment_links/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body = (await response.json()) as {
      amount_paid?: number;
      amount?: number;
      status?: string;
      notes?: Record<string, string>;
    };

    return {
      amountPaidRupees: Math.round((body.amount_paid || body.amount || 0) / 100),
      status: body.status ?? "",
      notes: body.notes ?? {},
    };
  } catch (error) {
    console.error("[razorpay] could not read the payment link:", error);
    return null;
  }
}

/**
 * Whether Razorpay really sent this donor back.
 *
 * Without this the thank-you page is a URL anyone can type, and a forged one
 * would be filed as a donation nobody made. Compared in constant time, because
 * a comparison that returns early tells an attacker how much of the digest it
 * got right.
 */
export function verifyCallback(params: {
  paymentLinkId: string;
  referenceId: string;
  status: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!KEY_SECRET || !params.signature) return false;

  const expected = createHmac("sha256", KEY_SECRET)
    .update(
      `${params.paymentLinkId}|${params.referenceId}|${params.status}|${params.paymentId}`,
    )
    .digest("hex");

  const given = params.signature.toLowerCase();
  if (given.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(given, "utf8"));
}

/** Rupees as a person writes them: ₹2,100. */
export function rupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
