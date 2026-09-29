import QRCode from "qrcode";
import { CopyButton } from "@/components/copy-button";
import { giveMethods, type GiveMethod } from "@/lib/giving";

/**
 * The ways to give that are not the card form.
 *
 * All of them at once, side by side, rather than behind a chooser. A donor
 * who wants UPI and a donor who wants a bank transfer are two different
 * people and neither should have to discover that the other option exists:
 * the whole point of this section is that the right rail is already on the
 * screen when they look for it.
 *
 * Nothing here takes a payment. These gifts arrive in the account without the
 * site ever knowing, which is why each card says who to tell.
 */

/**
 * The QR, drawn on the server.
 *
 * SVG rather than a canvas or an image service: it is a few hundred bytes of
 * markup, it stays sharp at any size, it needs no JavaScript, and it does not
 * hand a third party the trust's account details to render.
 */
async function qrSvg(value: string): Promise<string | null> {
  try {
    return await QRCode.toString(value, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#16305c", light: "#0000" },
    });
  } catch {
    // A value too long for a QR is still perfectly copyable below it.
    return null;
  }
}

export async function GiveMethods() {
  const methods = giveMethods();
  if (methods.length === 0) return null;

  const codes = await Promise.all(
    methods.map((method) => (method.qr ? qrSvg(method.qr) : Promise.resolve(null))),
  );

  return (
    <div className="section section-cream">
      <div className="shell">
        <div className="mb-8 max-w-2xl">
          <h2 style={{ fontSize: "var(--text-h2)" }}>Other ways to give</h2>
          <p className="mt-3" style={{ color: "var(--ink-600)" }}>
            Give straight from your bank, a UPI app or a wallet. Send us the details afterwards and
            we will send a receipt and add you to the updates from the gaushala.
          </p>
        </div>

        {/*
         * One column per method, all visible. Below the medium breakpoint they
         * stack in the same order, so the first thing a phone shows is the
         * rail most donors here actually use.
         */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method, at) => (
            <MethodCard key={method.id} method={method} qr={codes[at] ?? null} />
          ))}
        </div>

        <p className="mt-6" style={{ color: "var(--ink-400)", fontSize: "var(--text-sm)" }}>
          A gift sent this way does not reach the website, so it cannot be receipted
          automatically. Write to{" "}
          <a href="mailto:hello@punya.ngo" className="font-semibold">
            hello@punya.ngo
          </a>{" "}
          with the reference and we will confirm it.
        </p>
      </div>
    </div>
  );
}

function MethodCard({ method, qr }: { method: GiveMethod; qr: string | null }) {
  return (
    <article className="card flex flex-col gap-4">
      <div>
        <h3 className="card-title">{method.title}</h3>
        <p className="mt-1" style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
          {method.blurb}
        </p>
      </div>

      {qr && (
        <div
          className="mx-auto w-full max-w-[9rem] rounded-[var(--radius-md)] p-3"
          style={{ background: "var(--white, #fff)", border: "1px solid var(--border-warm)" }}
          // The QR is decorative: everything it encodes is written out below
          // it, and a reader who cannot scan it can copy the value instead.
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: qr }}
        />
      )}

      <dl className="flex flex-col gap-3">
        {method.details.map((detail) => (
          <div key={detail.label}>
            <dt
              className="mb-0.5 text-[11px] uppercase"
              style={{ color: "var(--ink-400)", letterSpacing: "var(--track-caps)" }}
            >
              {detail.label}
            </dt>
            <dd className="flex items-start justify-between gap-3">
              {/* break-all: a wallet address has no spaces to wrap at, and a
                  card that will not wrap it pushes the whole grid sideways. */}
              <span
                className="min-w-0 break-all font-[family-name:var(--font-mono,inherit)]"
                style={{ fontSize: "var(--text-sm)" }}
              >
                {detail.value}
              </span>
              <CopyButton value={detail.copy ?? detail.value} label={detail.label} />
            </dd>
          </div>
        ))}
      </dl>

      {method.note && (
        <p
          className="mt-auto rounded-[var(--radius-md)] p-3"
          style={{
            background: "var(--surface-warm)",
            color: "var(--ink-600)",
            fontSize: "var(--text-sm)",
          }}
        >
          {method.note}
        </p>
      )}
    </article>
  );
}
