"use client";

import { useActionState } from "react";
import { submitFormAction } from "@/app/actions";
import type { CmsForm } from "@/lib/cms";

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

/**
 * A form defined in the CMS.
 *
 * The fields, their labels and what is required all come from the workspace, so
 * changing the form is an edit there rather than a deploy here. Submitting goes
 * through a server action because the delivery key is server-only.
 */
export function CmsForm({ form, source }: { form: CmsForm; source?: string }) {
  const [state, action, pending] = useActionState(submitFormAction, { ok: false });

  if (state.ok) {
    return (
      <div
        className="card"
        style={{ background: "var(--cream-100)", borderColor: "var(--gold-300)" }}
      >
        <p style={{ color: "var(--text-heading)", fontWeight: 600 }}>
          {state.message || "Thank you. We have your message and will be in touch."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4">
      <input type="hidden" name="__form" value={form.key} />
      {source && <input type="hidden" name="__source" value={source} />}

      {form.fields.map((field) => {
        const invalid = state.fieldErrors?.[field.key];
        const shared = {
          id: field.key,
          name: field.key,
          required: field.required,
          placeholder: field.placeholder,
          style: {
            ...CONTROL,
            ...(invalid ? { borderColor: "var(--danger)" } : {}),
          },
        };

        return (
          <div key={field.key} className="space-y-1.5">
            <label
              htmlFor={field.key}
              style={{
                display: "block",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text-heading)",
              }}
            >
              {field.label}
              {field.required && <span style={{ color: "var(--danger)" }}> *</span>}
            </label>

            {field.type === "textarea" ? (
              <textarea {...shared} rows={4} style={{ ...shared.style, padding: "var(--space-3)" }} />
            ) : field.type === "select" ? (
              <select {...shared}>
                <option value="">Choose one</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...shared}
                type={field.type === "phone" ? "tel" : field.type === "email" ? "email" : "text"}
              />
            )}

            {invalid && (
              <p style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>{invalid}</p>
            )}
            {!invalid && field.help && (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>{field.help}</p>
            )}
          </div>
        );
      })}

      {state.error && (
        <p style={{ color: "var(--danger)", fontSize: "var(--text-sm)" }}>{state.error}</p>
      )}

      <button type="submit" className="btn btn-gold w-full" disabled={pending}>
        {pending ? "Sending…" : (form.submitLabel ?? "Send message")}
      </button>
    </form>
  );
}
