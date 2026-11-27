"use client";

import { useEffect, useState } from "react";
import { confirmCheckout, openCheckout, type CheckoutOrder } from "@tintorch/web/checkout";

/**
 * Giving online, by card, UPI or net banking.
 *
 * The money goes to the Trust's own merchant account; this page only opens
 * the gateway and then asks the server what happened. Nothing here decides
 * whether a payment succeeded - a browser saying it paid is how a free gift
 * gets a receipt.
 *
 * A named seva travels as its slug, never as its price. The server reads what
 * the seva costs from the CMS, so the amount cannot be edited on the way.
 */

const PRESETS = [501, 1100, 2100, 5100];

/** Survives the trip to a hosted gateway page and back. */
const PENDING = "punya:pending-order";

type Outcome = { kind: "paid" | "failed" | "pending" | "error"; message: string } | null;

export function PayOnline({
  seva: sevaProp,
  title,
  amount,
}: {
  /** A published seva's slug. Its price is fixed and read on the server. */
  seva?: string;
  title?: string;
  /** Rupees, for display only. The server is what charges. */
  amount?: number;
}) {
  /*
   * `?seva=` is read from the URL after mount rather than through
   * useSearchParams, which would opt this page out of static rendering and
   * demand a Suspense boundary around a donate button.
   */
  const [sevaFromUrl, setSevaFromUrl] = useState("");
  const seva = sevaProp ?? sevaFromUrl;

  const [chosen, setChosen] = useState<number | "other">(PRESETS[1]!);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("seva");
    if (slug) setSevaFromUrl(slug.toLowerCase());
  }, []);

  // A gateway that redirects brings the payer back to a fresh page, so the
  // order id is left behind where a reload can find it.
  useEffect(() => {
    let id: string | null = null;
    try {
      id = sessionStorage.getItem(PENDING);
    } catch {
      // Private browsing. Nothing to resume; the Trust still has the money.
    }
    if (!id) return;
    void settle(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function settle(orderId: string) {
    setBusy(true);
    setOutcome({ kind: "pending", message: "Checking with the bank…" });

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
        kind: "paid",
        message:
          "Thank you. The gift has reached the Trust. A receipt follows by email - write to hello@punya.ngo if it has not arrived in a day.",
      });
      return;
    }
    if (status === "FAILED") {
      setOutcome({
        kind: "failed",
        message: "The payment did not go through. Nothing has left your account; please try again.",
      });
      return;
    }
    setOutcome({
      kind: "pending",
      message:
        "Still settling. If money has left your account, it is on its way - write to hello@punya.ngo with the time you paid and it will be traced.",
    });
  }

  async function pay() {
    setOutcome(null);
    setBusy(true);

    const rupees = chosen === "other" ? Number(custom) : chosen;
    const body = seva
      ? { seva, name, email, phone }
      : { amount: rupees, name, email, phone };

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
        kind: "error",
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
      name: "Punya Charitable Trust",
      description: title ?? (seva ? "Seva" : "Donation"),
      prefill: { name, email, phone },
      returnUrl: typeof window === "undefined" ? undefined : `${window.location.origin}/donate`,
      themeColor: "#9a3412",
    });

    if (opened.result === "redirected") return; // This tab is on its way out.

    if (opened.result === "error") {
      setBusy(false);
      try {
        sessionStorage.removeItem(PENDING);
      } catch {
        /* nothing to clear */
      }
      setOutcome({ kind: "error", message: opened.error });
      return;
    }

    // Dismissed or submitted, the server is still the one that knows.
    await settle(order.id);
  }

  const fixed = Boolean(seva);
  const rupees = chosen === "other" ? Number(custom) : chosen;
  const payable = fixed || (Number.isFinite(rupees) && rupees >= 10);

  return (
    <div
      className="block"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-warm)",
        boxShadow: "var(--shadow-card)",
        padding: "var(--space-5)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{fixed ? (title ?? "Give this seva") : "Give online"}</h3>
      <p style={{ color: "var(--text-muted)", marginTop: ".25rem" }}>
        {fixed && amount
          ? `₹${amount.toLocaleString("en-IN")} by card, UPI or net banking.`
          : "Card, UPI or net banking. The gift reaches the Trust straight away."}
      </p>

      {!fixed && (
        <fieldset style={{ border: 0, padding: 0, margin: "1rem 0 0" }}>
          <legend className="sr-only">Amount</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
            {PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setChosen(value)}
                aria-pressed={chosen === value}
                className="btn"
                style={{
                  border: "1px solid var(--border-warm)",
                  background: chosen === value ? "var(--brand-accent)" : "transparent",
                  color: chosen === value ? "#fff" : "var(--text-heading)",
                  padding: ".5rem 1rem",
                }}
              >
                ₹{value.toLocaleString("en-IN")}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setChosen("other")}
              aria-pressed={chosen === "other"}
              className="btn"
              style={{
                border: "1px solid var(--border-warm)",
                background: chosen === "other" ? "var(--brand-accent)" : "transparent",
                color: chosen === "other" ? "#fff" : "var(--text-heading)",
                padding: ".5rem 1rem",
              }}
            >
              Other
            </button>
          </div>

          {chosen === "other" && (
            <label style={{ display: "block", marginTop: ".75rem" }}>
              <span className="sr-only">Amount in rupees</span>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                step={1}
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                placeholder="Amount in ₹"
                style={{ width: "100%", padding: ".6rem", border: "1px solid var(--border-warm)" }}
              />
            </label>
          )}
        </fieldset>
      )}

      <div style={{ display: "grid", gap: ".5rem", marginTop: "1rem" }}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          autoComplete="name"
          style={{ padding: ".6rem", border: "1px solid var(--border-warm)" }}
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email, for the receipt"
          autoComplete="email"
          style={{ padding: ".6rem", border: "1px solid var(--border-warm)" }}
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          type="tel"
          placeholder="Phone"
          autoComplete="tel"
          style={{ padding: ".6rem", border: "1px solid var(--border-warm)" }}
        />
      </div>

      <button
        type="button"
        onClick={() => void pay()}
        disabled={busy || !payable}
        className="btn btn-gold"
        style={{ width: "100%", marginTop: "1rem" }}
      >
        {busy
          ? "Working…"
          : fixed && amount
            ? `Give ₹${amount.toLocaleString("en-IN")}`
            : `Give ₹${Number.isFinite(rupees) && rupees > 0 ? rupees.toLocaleString("en-IN") : "…"}`}
      </button>

      {outcome && (
        <p
          role="status"
          style={{
            marginTop: ".75rem",
            color: outcome.kind === "paid" ? "var(--text-heading)" : "var(--text-muted)",
            fontWeight: outcome.kind === "paid" ? 600 : 400,
          }}
        >
          {outcome.message}
        </p>
      )}

      <p style={{ marginTop: ".75rem", fontSize: ".8rem", color: "var(--text-muted)" }}>
        Punya never sees your card number, UPI PIN or banking login. Those stay with the gateway.
      </p>
    </div>
  );
}
