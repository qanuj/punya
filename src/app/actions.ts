"use server";

import { headers } from "next/headers";
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

  /*
   * The Turnstile token is lifted out rather than passed as an answer: it is
   * not a field of this form, and the CMS reads it from the top level of the
   * submission.
   */
  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "").trim();

  const data: Record<string, unknown> = {};
  for (const [name, value] of formData.entries()) {
    if (name.startsWith("__") || name === "cf-turnstile-response") continue;
    if (typeof value !== "string") continue;
    /*
     * The honeypot travels even when empty. It is the one field whose blankness
     * is the answer, and the CMS files a filled one as spam rather than
     * dropping it - a browser that autofills the hidden box must not cost
     * somebody their message.
     */
    if (value.trim() || name === "_hp") data[name] = value.trim();
  }

  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    undefined;

  return submitForm(key, data, String(formData.get("__source") ?? "") || undefined, {
    ...(turnstileToken ? { turnstileToken } : {}),
    ...(clientIp ? { clientIp } : {}),
  });
}
