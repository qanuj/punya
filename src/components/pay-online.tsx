"use client";

import { useEffect, useState } from "react";
import { confirmCheckout, openCheckout, type CheckoutOrder } from "@tintorch/web/checkout";
import { GIVING_EMAIL, TRUST_NAME } from "@/lib/giving";

/**
 * Giving online, by card, UPI or net banking.
 *
 * The money goes to the Trust's own merchant account; this only opens the
 * gateway and then asks the server what happened. Nothing here decides
 * whether a payment succeeded - a browser saying it paid is how a free gift
 * gets a receipt.
 *
 * A named seva travels as its slug, never as its price, so the amount cannot
 * be edited on the way to the gateway.
 */

const PRESETS = [501, 1100, 2100, 5100];

/** Survives the trip to a hosted gateway page and back. */
const PENDING = "punya:pending-order";

type Outcome = { tone: "paid" | "failed" | "pending" | "error"; message: string } | null;

export function PayOnline({
  seva: sevaProp,
  title,
  amount,
  framed = true,
}: {
  /** A published seva's slug. Its price is fixed and read on the server. */
  seva?: string;
  title?: string;
  /** Rupees, for display only. The server is what charges. */
  amount?: number;
  /** False when a parent already provides the card, so cards never nest. */
  framed?: boolean;
}) {
  const [sevaFromUrl, setSevaFromUrl] = useState("");
  const seva = sevaProp ?? sevaFromUrl;

  const [chosen, setChosen] = useState<number | "other">(PRESETS[1]!);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  /*
   * `?seva=` is read after mount rather than through useSearchParams, which
   * would opt this page out of static rendering and demand a Suspense
   * boundary around a donate button.
   */
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("seva");
    if (slug) setSevaFromUrl(slug.toLowerCase());
  }, []);

  // A gateway that redirects brings the payer back to a fresh page, so the
  // order id is left where a reload can find it.
  useEffect(() => {
    let id: string | null = null;
    try {
      id = sessionStorage.getItem(PENDING);
    } catch {
      // Private browsing. Nothing to resume; the Trust still has the money.
    }
    if (id) void settle(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function settle(orderId: string) {
    setBusy(true);
    setOutcome({ tone: "pending", message: "Checking with the bank…" });

    const status = await confirmCheckout({
      statusUrl: `/api/checkout/${orderId}`,
      onProblem: (problem) => console.warn("[checkout]", problem.status, problem.message),
    });

    try {
      sessionStorage.removeItem(PENDING);
    } catch {
      /* nothing to clear */
    }
    setBusy(false);

    if (status === "PAID") {
      setOutcome({
        tone: "paid",
        message: `Thank you. The gift has reached the Trust, and a receipt follows by email. Write to ${GIVING_EMAIL} if it has not arrived within a day.`,
      });
    } else if (status === "FAILED") {
      setOutcome({
        tone: "failed",
        message: "The payment did not go through. Nothing has left your account; please try again.",
      });
    } else {
      setOutcome({
        tone: "pending",
        message: `Still settling. If money has left your account it is on its way - write to ${GIVING_EMAIL} with the time you paid and it will be traced.`,
      });
    }
  }

  async function pay() {
    setOutcome(null);
    setBusy(true);

    const rupees = chosen === "other" ? Number(custom) : chosen;
    const body = seva ? { seva, name, email, phone } : { amount: rupees, name, email, phone };

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);

    const json = (await response?.json().catch(() => null)) as
      | { data?: CheckoutOrder; error?: { message?: string } }
      | null;

    if (!response?.ok || !json?.data) {
      setBusy(false);
      setOutcome({
        tone: "error",
        message: json?.error?.message ?? "The payment could not be started. Please try again.",
      });
      return;
    }

    const order = json.data;
    try {
      sessionStorage.setItem(PENDING, order.id);
    } catch {
      /* the poll below still runs for a gateway that stays on this page */
    }

    const opened = await openCheckout({
      order,
      name: TRUST_NAME,
      description: title ?? (seva ? "Seva" : "Donation"),
      prefill: { name, email, phone },
      returnUrl: `${window.location.origin}/donate`,
      // The system's own gold, so the gateway's screen is not a different brand.
      themeColor: "#D9952A",
    });

    if (opened.result === "redirected") return; // This tab is on its way out.

    if (opened.result === "error") {
      setBusy(false);
      try {
        sessionStorage.removeItem(PENDING);
      } catch {
        /* nothing to clear */
      }
      setOutcome({ tone: "error", message: opened.error });
      return;
    }

    // Dismissed or submitted, the server is still the one that knows.
    await settle(order.id);
  }

  const fixed = Boolean(seva);
  const rupees = chosen === "other" ? Number(custom) : chosen;
  const payable = fixed || (Number.isFinite(rupees) && rupees >= 10);
  const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  const inner = (
    <>
      {!fixed && (
        <fieldset className="give-amounts">
          <legend className="sr-only">Amount</legend>
          {PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              className="give-chip"
              aria-pressed={chosen === value}
              onClick={() => setChosen(value)}
            >
              {inr(value)}
            </button>
          ))}
          <button
            type="button"
            className="give-chip"
            aria-pressed={chosen === "other"}
            onClick={() => setChosen("other")}
          >
            Other
          </button>
        </fieldset>
      )}

      <div className="give-fields">
        {chosen === "other" && !fixed && (
          <input
            className="give-input"
            type="number"
            inputMode="numeric"
            min={10}
            step={1}
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="Amount in ₹"
            aria-label="Amount in rupees"
            autoFocus
          />
        )}
        <input
          className="give-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          autoComplete="name"
        />
        <input
          className="give-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email, for the receipt"
          aria-label="Email, for the receipt"
          autoComplete="email"
        />
      </div>

      <button
        type="button"
        className="btn btn-gold give-submit"
        onClick={() => void pay()}
        disabled={busy || !payable}
      >
        {busy
          ? "Working…"
          : fixed && amount
            ? `Give ${inr(amount)}`
            : Number.isFinite(rupees) && rupees > 0
              ? `Give ${inr(rupees)}`
              : "Enter an amount"}
      </button>

      {outcome && (
        <p className="give-status" data-tone={outcome.tone} role="status">
          {outcome.message}
        </p>
      )}

      <p className="give-fineprint">
        Card, UPI, net banking or a wallet. Punya never sees your card number, UPI PIN or banking
        login.
      </p>
    </>
  );

  if (!framed) return inner;

  return (
    <div className="give">
      <h3 className="give-title">{fixed ? (title ?? "Give this seva") : "Give online"}</h3>
      {fixed && amount && <p className="give-lede">{inr(amount)}, paid securely online.</p>}
      {inner}
    </div>
  );
}
