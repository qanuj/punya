"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { confirmCheckout, openCheckout, type CheckoutOrder } from "@tintorch/web/checkout";
import { CopyButton } from "@/components/copy-button";
import { GAUSHALA_PATH, GIVING_EMAIL, TRUST_NAME } from "@/lib/giving";

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

type Problem = { tone: "failed" | "error"; message: string } | null;

/**
 * What the card is showing.
 *
 * Once money has arrived the form goes away. Leaving the chips and a live
 * Give button under a thank-you reads as though nothing happened, and invites
 * a second payment from somebody checking whether the first one worked.
 */
export type View =
  | { at: "form" }
  | { at: "given"; orderId: string; amount: number }
  | { at: "unsettled"; orderId: string };

export function PayOnline({
  seva: sevaProp,
  title,
  amount,
  framed = true,
  onView,
}: {
  /** A published seva's slug. Its price is fixed and read on the server. */
  seva?: string;
  title?: string;
  /** Rupees, for display only. The server is what charges. */
  amount?: number;
  /** False when a parent already provides the card, so cards never nest. */
  framed?: boolean;
  /** Lets a parent that owns the heading step back once a gift has landed. */
  onView?: (at: View["at"]) => void;
}) {
  const [sevaFromUrl, setSevaFromUrl] = useState("");
  const seva = sevaProp ?? sevaFromUrl;

  const [chosen, setChosen] = useState<number | "other">(PRESETS[1]!);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [view, setView] = useState<View>({ at: "form" });

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

  /*
   * A changed state is brought into view and focused.
   *
   * A payer returning from a hosted gateway lands at the top of a fresh page,
   * and on a phone the hero alone fills the screen: the thank-you was there,
   * below the fold, and they had no way of knowing. Focusing the heading also
   * makes a screen reader say it, rather than leaving the result silent.
   */
  const announce = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    onView?.(view.at);
    if (view.at === "form" || !announce.current) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    announce.current.scrollIntoView({
      block: "center",
      behavior: still ? "auto" : "smooth",
    });
    announce.current.focus({ preventScroll: true });
  }, [view.at, onView]);

  const rupees = chosen === "other" ? Number(custom) : chosen;
  const given = amount ?? (Number.isFinite(rupees) ? rupees : 0);
  const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  async function settle(orderId: string) {
    setBusy(true);
    setProblem(null);

    const status = await confirmCheckout({
      statusUrl: `/api/checkout/${orderId}`,
      onProblem: (p) => console.warn("[checkout]", p.status, p.message),
    });

    try {
      sessionStorage.removeItem(PENDING);
    } catch {
      /* nothing to clear */
    }
    setBusy(false);

    if (status === "PAID") {
      /*
       * Ask what was actually charged rather than what this tab remembers.
       * A payer coming back from a hosted gateway page arrives on a fresh
       * mount whose amount is still the default, and thanking somebody for
       * the wrong number is worse than not naming one.
       */
      const settled = (await fetch(`/api/checkout/${orderId}`, {
        cache: "no-store",
      })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)) as { data?: { amount?: number } } | null;
      const paise = Number(settled?.data?.amount);

      setView({
        at: "given",
        orderId,
        amount: Number.isFinite(paise) && paise > 0 ? paise / 100 : given,
      });
    } else if (status === "FAILED") {
      setProblem({
        tone: "failed",
        message: "The payment did not go through. Nothing has left your account.",
      });
    } else {
      setView({ at: "unsettled", orderId });
    }
  }

  async function pay() {
    setProblem(null);
    setBusy(true);

    const body = seva ? { seva, name, email, phone } : { amount: rupees, name, email, phone };

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);

    const json = (await response?.json().catch(() => null)) as {
      data?: CheckoutOrder;
      error?: { message?: string };
    } | null;

    if (!response?.ok || !json?.data) {
      setBusy(false);
      setProblem({
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
      setProblem({ tone: "error", message: opened.error });
      return;
    }

    // Dismissed or submitted, the server is still the one that knows.
    await settle(order.id);
  }

  function startOver() {
    setView({ at: "form" });
    setProblem(null);
    setCustom("");
  }

  const fixed = Boolean(seva);
  const payable = fixed || (Number.isFinite(rupees) && rupees >= 10);

  /* ── After the money arrives ───────────────────────────────────────── */

  if (view.at === "given") {
    const body = (
      <div className="give-done">
        <svg
          className="give-check"
          width="44"
          height="44"
          viewBox="0 0 44 44"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m12 23 7 7 14-16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <h3 className="give-done-title" ref={announce} tabIndex={-1}>
          {name.trim() ? `Thank you, ${name.trim().split(" ")[0]}.` : "Thank you."}
        </h3>

        <p className="give-done-line">
          <strong>{inr(view.amount)}</strong> has reached {TRUST_NAME}
          {title ? ` for ${title}` : ""}.
        </p>

        <p className="give-done-note">
          {email.trim()
            ? `A receipt is on its way to ${email.trim()}. If it has not arrived within a day, write to ${GIVING_EMAIL}.`
            : `For a receipt, write to ${GIVING_EMAIL} quoting the reference below.`}
        </p>

        <p className="give-ref">
          Reference {view.orderId.slice(0, 8)}
          <CopyButton value={view.orderId} label="reference" />
        </p>

        <div className="give-actions">
          <Link href={GAUSHALA_PATH} className="btn btn-gold">
            See the gaushala
          </Link>
          <button type="button" className="btn btn-outline" onClick={startOver}>
            Give again
          </button>
        </div>
      </div>
    );
    return framed ? <div className="give">{body}</div> : body;
  }

  /* ── Paid, but the bank has not said so yet ────────────────────────── */

  if (view.at === "unsettled") {
    const body = (
      <div className="give-waiting">
        <h3 className="give-done-title" ref={announce} tabIndex={-1}>
          Still settling
        </h3>
        <p className="give-done-note">
          The bank has not confirmed this one yet. If money has left your account it is on its way,
          and nothing more is needed from you. Write to {GIVING_EMAIL} with the reference if you
          would like it traced.
        </p>
        <p className="give-ref">
          Reference {view.orderId.slice(0, 8)}
          <CopyButton value={view.orderId} label="reference" />
        </p>
        <div className="give-actions">
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => void settle(view.orderId)}
            disabled={busy}
          >
            {busy ? "Checking…" : "Check again"}
          </button>
          <button type="button" className="btn btn-outline" onClick={startOver}>
            Start over
          </button>
        </div>
      </div>
    );
    return framed ? <div className="give">{body}</div> : body;
  }

  /* ── The form ──────────────────────────────────────────────────────── */

  const form = (
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
            className="give-input give-field-wide"
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
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone"
          aria-label="Phone number"
          autoComplete="tel"
        />
        <input
          className="give-input give-field-wide"
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
        aria-busy={busy}
      >
        {busy
          ? "Working…"
          : problem
            ? "Try again"
            : fixed && amount
              ? `Give ${inr(amount)}`
              : Number.isFinite(rupees) && rupees > 0
                ? `Give ${inr(rupees)}`
                : "Enter an amount"}
      </button>

      {problem && (
        <p className="give-status" data-tone={problem.tone} role="alert">
          {problem.message}
        </p>
      )}

      <p className="give-fineprint">
        Card, UPI, net banking or a wallet. Punya never sees your card number, UPI PIN or banking
        login.
      </p>
    </>
  );

  if (!framed) return form;

  return (
    <div className="give">
      <h3 className="give-title">{fixed ? (title ?? "Give this seva") : "Give online"}</h3>
      {fixed && amount && <p className="give-lede">{inr(amount)}, paid securely online.</p>}
      {form}
    </div>
  );
}
