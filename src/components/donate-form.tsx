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

      <fieldset className="space-y-3">
        <legend className="mb-3" style={{ fontWeight: 600, color: "var(--text-heading)" }}>
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
                className="rounded-[var(--radius-pill)] px-4 py-2 font-semibold transition-colors"
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

        <label htmlFor="amount" className="block text-sm" style={{ color: "var(--ink-600)" }}>
          Or enter an amount
        </label>
        <div className="flex items-center gap-2">
          <span
            className="font-[family-name:var(--font-serif)]"
            style={{ fontSize: "var(--text-h3)", color: "var(--navy-700)" }}
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
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="1100"
            style={{
              ...CONTROL,
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

      <div className="space-y-4">
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

      <div className="space-y-3">
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
    <div className="space-y-1.5">
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
