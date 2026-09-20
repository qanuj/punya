"use server";

import { redirect } from "next/navigation";
import { getSite } from "@/lib/cms";
import {
  createPaymentLink,
  razorpayConfigured,
  MAX_RUPEES,
  MIN_RUPEES,
  rupees,
} from "@/lib/razorpay";

export type DonationState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Where Razorpay sends the donor back to. Absolute, as Razorpay requires. */
async function callbackUrl(): Promise<string> {
  const site = await getSite();
  const base = (site.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  return `${base}/donate/thank-you`;
}

/**
 * A donation, from the page to Razorpay.
 *
 * Everything that decides the amount happens here, on the server: the browser
 * sends what the donor typed, this reads it, checks it, and asks Razorpay for
 * a link at that figure. The redirect is the last thing it does, so a donor
 * whose details are wrong never leaves the page.
 */
export async function startDonation(
  _previous: DonationState,
  formData: FormData,
): Promise<DonationState> {
  if (!razorpayConfigured) {
    return {
      error:
        "Online giving is not switched on yet. Please call +91 93051 59984 or write to hello@punya.ngo and we will take your seva personally.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const seva = String(formData.get("seva") ?? "").trim();
  const sevaName = String(formData.get("sevaName") ?? "").trim();

  /*
   * "2,100" and "₹2100" are both what a person types into a box asking for an
   * amount, and neither is a number. Anything that is not a digit goes.
   */
  const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d.]/g, ""));

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Please tell us who is giving.";
  if (!email) fieldErrors.email = "We need an email to send the receipt to.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "That email looks wrong.";
  if (phone && !/^[+\d][\d\s-]{7,}$/.test(phone)) fieldErrors.phone = "That phone number looks wrong.";

  if (!Number.isFinite(amount) || amount <= 0) fieldErrors.amount = "Choose an amount.";
  else if (amount < MIN_RUPEES) fieldErrors.amount = `The smallest seva we can take online is ${rupees(MIN_RUPEES)}.`;
  else if (amount > MAX_RUPEES)
    fieldErrors.amount = `For a gift above ${rupees(MAX_RUPEES)}, please write to hello@punya.ngo so we can help directly.`;

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  let url: string;
  try {
    const link = await createPaymentLink({
      rupees: Math.round(amount),
      donor: { name, email, ...(phone ? { phone } : {}) },
      description: sevaName ? `${sevaName} - Punya Charitable Trust` : "Gau seva - Punya Charitable Trust",
      callbackUrl: await callbackUrl(),
      notes: {
        ...(seva ? { seva } : {}),
        ...(sevaName ? { sevaName } : {}),
        donorName: name,
        donorEmail: email,
        ...(phone ? { donorPhone: phone } : {}),
      },
    });
    url = link.url;
  } catch (error) {
    console.error(error);
    return {
      error:
        "We could not reach the payment provider just now. Please try again in a moment, or write to hello@punya.ngo.",
    };
  }

  // Outside the try: redirect() works by throwing, and catching it here would
  // turn a working donation into an error message.
  redirect(url);
}
