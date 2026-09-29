"use client";

import { useState } from "react";

/**
 * Copy one detail.
 *
 * An account number, an IFSC or a wallet address is retyped wrong more often
 * than it is retyped right, and a wallet address retyped wrong is money gone.
 * So every value on the giving card is one tap rather than a selection.
 *
 * The confirmation is the button's own label for a moment: a toast somewhere
 * else on the page is a second thing to find, and the answer belongs where
 * the question was asked.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // A browser that refuses the clipboard leaves the text selectable,
          // which is what a donor would have done anyway.
        }
      }}
      aria-label={`Copy ${label}`}
      className="shrink-0 rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors"
      style={{
        background: copied ? "var(--gold-100)" : "var(--surface-warm)",
        color: copied ? "var(--gold-600)" : "var(--navy-700)",
        letterSpacing: "var(--track-caps)",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
