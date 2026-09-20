import type { Metadata } from "next";
import Link from "next/link";
import { submitForm } from "@/lib/cms";
import { fetchPaymentLink, rupees, verifyCallback } from "@/lib/razorpay";

/**
 * Where Razorpay sends a donor back to.
 *
 * Two jobs, in this order: tell the donor what happened, and write the gift
 * down. The signature decides which page they see - without it this URL is
 * one anybody could type, and a forged visit would be filed as a donation
 * nobody made.
 *
 * The recording is best-effort on purpose. The money has already moved by the
 * time anyone gets here, so a CMS that is down must not turn a completed
 * donation into an error page; it is logged instead, and Razorpay's own record
 * is the one that settles arguments.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: true },
};

type Params = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (value: string | string[] | undefined): string =>
  typeof value === "string" ? value : Array.isArray(value) ? (value[0] ?? "") : "";

export default async function ThankYou({ searchParams }: Params) {
  const query = await searchParams;

  const paymentId = one(query.razorpay_payment_id);
  const paymentLinkId = one(query.razorpay_payment_link_id);
  const referenceId = one(query.razorpay_payment_link_reference_id);
  const status = one(query.razorpay_payment_link_status);
  const signature = one(query.razorpay_signature);

  const genuine =
    Boolean(paymentId && paymentLinkId && signature) &&
    verifyCallback({ paymentLinkId, referenceId, status, paymentId, signature });

  if (!genuine) {
    return (
      <Outcome
        title="We could not confirm this payment"
        lines={[
          "This page could not verify the payment it was sent. If money has left your account, nothing is lost - write to hello@punya.ngo with the time you paid and we will find it.",
        ]}
      />
    );
  }

  if (status !== "paid") {
    return (
      <Outcome
        title="This donation was not completed"
        lines={[
          "The payment was not finished, so nothing has been taken. You are welcome to try again whenever you are ready.",
        ]}
        cta={{ href: "/donate", label: "Try again" }}
      />
    );
  }

  /*
   * Who gave, and how much, read back from Razorpay rather than taken from the
   * URL. The link was created with those details as notes precisely so this
   * page could ask for them instead of carrying them past the donor's browser.
   */
  const link = await fetchPaymentLink(paymentLinkId);
  const amount = link?.amountPaidRupees ?? 0;

  await record({ paymentId, paymentLinkId, amount, notes: link?.notes ?? {} });

  return (
    <Outcome
      title="Your seva is received"
      lines={[
        amount > 0
          ? `Thank you for ${rupees(amount)}. Your receipt is on its way to the email you gave us.`
          : "Thank you. Your receipt is on its way to the email you gave us.",
        "Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala.",
      ]}
      reference={paymentId}
      cta={{ href: "/seva", label: "See other ways to serve" }}
    />
  );
}

/**
 * The gift, written into the CMS beside the enquiries.
 *
 * Best-effort, and deliberately so: the money has moved by the time anyone is
 * on this page, so a CMS that is down must not turn a completed donation into
 * an error. It is logged instead, and Razorpay's own record is the one that
 * settles arguments.
 */
async function record({
  paymentId,
  paymentLinkId,
  amount,
  notes,
}: {
  paymentId: string;
  paymentLinkId: string;
  amount: number;
  notes: Record<string, string>;
}): Promise<void> {
  const name = notes.donorName ?? "";
  const email = notes.donorEmail ?? "";
  if (!name || !email) {
    console.error("[donate] not recorded: the payment link carried no donor");
    return;
  }

  try {
    const result = await submitForm(
      "donation",
      {
        fullName: name,
        email,
        ...(notes.donorPhone ? { phone: notes.donorPhone } : {}),
        amountInRupees: String(amount),
        ...(notes.sevaName ? { seva: notes.sevaName } : {}),
        razorpayPaymentId: paymentId,
        razorpayPaymentLinkId: paymentLinkId,
      },
      "/donate/thank-you",
    );

    if (!result.ok) console.error("[donate] not recorded:", result.error ?? result.message);
  } catch (error) {
    console.error("[donate] not recorded:", error);
  }
}

function Outcome({
  title,
  lines,
  reference,
  cta,
}: {
  title: string;
  lines: string[];
  reference?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <article>
      <header className="section-warm" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="shell">
          <h1 className="max-w-3xl" style={{ fontSize: "var(--text-h1)", lineHeight: "var(--lh-tight)" }}>
            {title}
          </h1>
        </div>
      </header>

      <div className="section">
        <div className="shell max-w-2xl space-y-4">
          {lines.map((line) => (
            <p key={line} style={{ color: "var(--ink-600)", fontSize: "var(--text-body-lg)" }}>
              {line}
            </p>
          ))}

          {reference && (
            <p className="text-sm" style={{ color: "var(--ink-400)" }}>
              Payment reference {reference}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {cta && (
              <Link href={cta.href} className="btn btn-gold">
                {cta.label}
              </Link>
            )}
            <Link href="/" className="btn btn-outline">
              Back to the home page
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
