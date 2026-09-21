"use server";

import { headers } from "next/headers";
import { clientIpFrom, getForm, submitForm, turnstileRequired, type SubmitResult } from "@/lib/cms";

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

  /*
   * A server action is an HTTP endpoint, so a bot posts this body directly and
   * simply leaves the token out. Forwarding that absence made it look to the
   * CMS exactly like a workspace with Turnstile switched off, which is how the
   * widget came to be rendered on every form while enforcing nothing. The form
   * definition is the only thing that knows whether one was expected, so it is
   * asked before the submission is relayed.
   *
   * This is stricter than the CMS's own rule, which scores a missing token
   * rather than refusing on it, and the cost is real: a visitor whose browser
   * blocks the Cloudflare script now cannot send this form at all. It is the
   * right side to err on here and the wrong one there - the CMS answers for
   * six sites and cannot tell which of them put a widget on the page, while
   * this site knows, because it just read the key that did.
   */
  const form = await getForm(key);
  if (turnstileRequired(form) && !turnstileToken) {
    return {
      ok: false,
      error: "We could not confirm you are a person. Reload the page and try again.",
    };
  }

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

  const clientIp = clientIpFrom(await headers());

  return submitForm(key, data, String(formData.get("__source") ?? "") || undefined, {
    ...(turnstileToken ? { turnstileToken } : {}),
    ...(clientIp ? { clientIp } : {}),
  });
}
