"use client";

import { useActionState, useState } from "react";
import { startDonation, type DonationState } from "@/app/donate/actions";

/**
 * The giving form.
 *
 * One decision at a time: how much, then who. The presets are there because
 * most people want to be told what a normal gift looks like, and the box is
 * there because the ones who have already decided should not have to fight the
 * presets. Choosing a preset writes into the same box, so there is only ever
 * one amount on the page and it is the one being sent.
 */

const CONTROL: React.CSSProperties = {
  width: "100%",
  minHeight: "44px",
  border: "1px solid var(--border-cool)",
  borderRadius: "var(--radius-md)",
  background: "var(--surface-card)",
  padding: "0 var(--space-3)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-body)",
  color: "var(--text-strong)",
};

const PRESETS = [501, 1100, 2100, 5100];

export function DonateForm({
  seva,
  sevaName,
  defaultAmount,
}: {
  seva?: string;
  sevaName?: string;
  defaultAmount?: number;
}) {
  const [state, action, pending] = useActionState<DonationState, FormData>(startDonation, {});
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");

  /*
   * Held here rather than left to the DOM. React resets an uncontrolled form
   * once its action returns, so a donor who mistyped their email got the error
   * and an empty form - asked to type their name again to be told again.
   */
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" });
  const bind = (key: keyof typeof donor) => ({
    value: donor[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setDonor((current) => ({ ...current, [key]: event.target.value })),
  });

  const presets = defaultAmount && !PRESETS.includes(defaultAmount)
    ? [defaultAmount, ...PRESETS].slice(0, 5)
    : PRESETS;

  return (
    <form action={action} className="card space-y-6">
      {seva && <input type="hidden" name="seva" value={seva} />}
      {sevaName && <input type="hidden" name="sevaName" value={sevaName} />}

      <fieldset className="space-y-2.5">
        <legend className="mb-2.5" style={{ fontWeight: 600, color: "var(--text-heading)" }}>
          How much would you like to give?
        </legend>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const chosen = amount === String(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                aria-pressed={chosen}
                className="rounded-[var(--radius-pill)] px-3.5 py-1.5 font-semibold transition-colors"
                style={{
                  border: `1.5px solid ${chosen ? "var(--gold-400)" : "var(--border-warm)"}`,
                  background: chosen ? "var(--gold-100)" : "var(--surface-card)",
                  color: chosen ? "var(--gold-600)" : "var(--navy-700)",
                  fontSize: "var(--text-body)",
                }}
              >
                ₹{preset.toLocaleString("en-IN")}
              </button>
            );
          })}
        </div>

        {/*
          * The rupee sits inside the field rather than beside it.
          *
          * It was a 28px serif glyph in its own flex column with a label above
          * saying "Or enter an amount", which is three elements and two lines
          * of vertical space to say what a prefix inside the box says on its
          * own. The label is gone with it: the legend above already asked the
          * question, and the presets and the box are two ways to answer it.
          */}
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
            style={{ color: "var(--ink-400)", fontSize: "var(--text-body)" }}
            aria-hidden
          >
            ₹
          </span>
          <input
            id="amount"
            name="amount"
            inputMode="numeric"
            autoComplete="off"
            required
            aria-label="Amount in rupees"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Other amount"
            style={{
              ...CONTROL,
              paddingLeft: "1.85rem",
              ...(state.fieldErrors?.amount ? { borderColor: "var(--danger)" } : {}),
            }}
          />
        </div>
        {state.fieldErrors?.amount && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {state.fieldErrors.amount}
          </p>
        )}
      </fieldset>

      {/* Two-up above 32rem: name and email are short, and stacking every
          field turned a four-question form into a full screen of scrolling. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="name"
          label="Your name"
          placeholder="Anuj Pandey"
          autoComplete="name"
          required
          error={state.fieldErrors?.name}
          {...bind("name")}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          hint="Your receipt goes here."
          error={state.fieldErrors?.email}
          {...bind("email")}
        />
        <Field
          id="phone"
          label="Phone"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          hint="Optional."
          error={state.fieldErrors?.phone}
          {...bind("phone")}
        />
      </div>

      {state.error && (
        <p
          className="rounded-[var(--radius-md)] p-4 text-sm"
          style={{ background: "var(--surface-warm)", color: "var(--danger)" }}
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <button type="submit" className="btn btn-gold w-full" disabled={pending}>
          {pending ? "Taking you to payment…" : "Continue to payment"}
        </button>
        <p className="text-center text-sm" style={{ color: "var(--ink-400)" }}>
          Payment is taken by Razorpay. Punya never sees your card or UPI details.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block" style={{ fontWeight: 600, color: "var(--text-heading)" }}>
        {label}
        {rest.required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      <input
        id={id}
        name={id}
        {...rest}
        style={{ ...CONTROL, ...(error ? { borderColor: "var(--danger)" } : {}) }}
      />
      {error ? (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-sm" style={{ color: "var(--ink-400)" }}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
