"use client";

import { useState } from "react";

/**
 * Copy one value, and say so.
 *
 * Sits next to the strings nobody should have to retype: a UPI id, an account
 * number, the reference a payer quotes when they write in about a gift.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      className="give-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        } catch {
          // A browser that refuses the clipboard still shows the value above.
        }
      }}
      aria-label={done ? `${label} copied` : `Copy ${label}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {done ? (
          <path
            d="m5 13 4 4L19 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <rect
              x="9"
              y="9"
              width="11"
              height="11"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5 15V6a2 2 0 0 1 2-2h8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {done ? "Copied" : "Copy"}
    </button>
  );
}
