import { NextResponse } from "next/server";
import { createOrder, sevaPrice, MAX_PAISE, MIN_PAISE } from "@/lib/checkout";

export const dynamic = "force-dynamic";

/**
 * Open a payment for a gift.
 *
 * Two shapes: a free amount typed on the donate page, or the slug of a
 * published seva whose price is read from the CMS here. The browser never
 * names the price of a named thing.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    amount?: number;
    seva?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;

  const origin = new URL(request.url).origin;
  const stamp = Date.now().toString(36);

  let amountPaise: number;
  let purpose: string;
  let referenceId: string;

  const slug = typeof body?.seva === "string" ? body.seva.trim().toLowerCase() : "";
  if (slug) {
    const seva = await sevaPrice(slug);
    if (!seva) {
      return NextResponse.json({ error: { message: "That seva was not found." } }, { status: 404 });
    }
    amountPaise = seva.amountPaise;
    purpose = seva.title;
    referenceId = `seva-${slug}-${stamp}`;
  } else {
    // Rupees from the page, paise from here on.
    const rupees = Number(body?.amount);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      return NextResponse.json({ error: { message: "Enter an amount." } }, { status: 422 });
    }
    amountPaise = Math.round(rupees * 100);
    if (amountPaise < MIN_PAISE || amountPaise > MAX_PAISE) {
      return NextResponse.json(
        {
          error: {
            message: `Choose between ₹${MIN_PAISE / 100} and ₹${(MAX_PAISE / 100).toLocaleString("en-IN")}. For a larger gift, write to hello@punya.ngo.`,
          },
        },
        { status: 422 },
      );
    }
    purpose = "Donation to Punya Charitable Trust";
    referenceId = `donate-${stamp}`;
  }

  const order = await createOrder({
    amountPaise,
    purpose,
    referenceId,
    name: body?.name?.trim() || undefined,
    email: body?.email?.trim() || undefined,
    phone: body?.phone?.trim() || undefined,
    // Cashfree and Stripe hand the payer back here; the page confirms on arrival.
    returnUrl: `${origin}/donate`,
  });

  if ("error" in order) {
    return NextResponse.json({ error: { message: order.error } }, { status: order.status });
  }
  return NextResponse.json({ data: order }, { status: 201 });
}
