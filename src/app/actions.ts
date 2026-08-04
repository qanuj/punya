"use server";

import { submitForm, type SubmitResult } from "@/lib/cms";

/**
 * A form submission, from the browser to the CMS.
 *
 * A server action rather than a fetch from the page: the delivery key is
 * server-only and must not reach a bundle.
 */
export async function submitFormAction(
  _previous: SubmitResult,
  formData: FormData,
): Promise<SubmitResult> {
  const key = String(formData.get("__form") ?? "");
  if (!key) return { ok: false, error: "This form is not connected yet." };

  const data: Record<string, unknown> = {};
  for (const [name, value] of formData.entries()) {
    if (name.startsWith("__") || typeof value !== "string") continue;
    if (value.trim()) data[name] = value.trim();
  }

  return submitForm(key, data, String(formData.get("__source") ?? "") || undefined);
}
