import "server-only";

/**
 * The ways to give that do not go through a payment page.
 *
 * A bank transfer, a UPI id and a wallet address are all the same shape of
 * thing: a detail somebody copies, and a gift that arrives without the site
 * ever hearing about it. They are configuration rather than content because
 * they are the trust's account details - not something an editor should be
 * able to change from a browser session, and not something to keep in a
 * content type where a wrong keystroke sends money to nobody.
 *
 * Every method is optional. A method with nothing configured does not render,
 * so this ships switched off and appears as each one is filled in.
 */

export type GiveDetail = {
  label: string;
  value: string;
  /** Shown as written; copied exactly. An account number keeps its spacing. */
  copy?: string;
};

export type GiveMethod = {
  id: "bank" | "upi" | "crypto";
  title: string;
  blurb: string;
  details: GiveDetail[];
  /** What a QR should encode, when a QR helps. */
  qr?: string;
  note?: string;
};

const text = (name: string): string => (process.env[name] ?? "").trim();

/**
 * A bank transfer, as an Indian donor's banking app asks for it.
 *
 * SWIFT is separate and optional because it is only needed from outside
 * India, and a foreign transfer to an Indian trust is an FCRA question before
 * it is a banking one.
 */
function bank(): GiveMethod | null {
  const accountNumber = text("GIVE_BANK_ACCOUNT_NUMBER");
  const ifsc = text("GIVE_BANK_IFSC");
  if (!accountNumber || !ifsc) return null;

  const details: GiveDetail[] = [
    { label: "Account name", value: text("GIVE_BANK_ACCOUNT_NAME") },
    { label: "Account number", value: accountNumber },
    { label: "IFSC", value: ifsc },
    { label: "Bank", value: text("GIVE_BANK_NAME") },
    { label: "Branch", value: text("GIVE_BANK_BRANCH") },
    { label: "SWIFT", value: text("GIVE_BANK_SWIFT") },
  ].filter((detail) => detail.value);

  return {
    id: "bank",
    title: "Bank transfer",
    blurb: "NEFT, IMPS or RTGS from any Indian bank.",
    details,
  };
}

/**
 * UPI.
 *
 * The QR encodes the standard `upi://pay` link, which every UPI app in India
 * reads - so a donor scans and their own app opens with the payee filled in.
 * No amount is set: this page is for a gift the donor decides the size of.
 */
function upi(): GiveMethod | null {
  const id = text("GIVE_UPI_ID");
  if (!id) return null;

  const payee = text("GIVE_UPI_NAME") || text("GIVE_BANK_ACCOUNT_NAME");
  const params = new URLSearchParams({ pa: id, cu: "INR" });
  if (payee) params.set("pn", payee);

  return {
    id: "upi",
    title: "UPI",
    blurb: "Scan with any UPI app, or copy the id.",
    details: [
      { label: "UPI id", value: id },
      ...(payee ? [{ label: "Name", value: payee }] : []),
    ],
    qr: `upi://pay?${params.toString()}`,
  };
}

/**
 * Wallet addresses.
 *
 * One per line as `Label | address`, because which chains a wallet holds is
 * not something to hard-code: adding USDT on another network should be an
 * environment change, not a deploy of new code.
 *
 *   GIVE_CRYPTO="USDT (TRON, TRC20) | TX...\nBitcoin | bc1..."
 *
 * The label carries the network on purpose. An address pasted under the wrong
 * one loses the money permanently, and the label is the only thing on the page
 * that tells a donor which chain to send on.
 */
function crypto(): GiveMethod | null {
  const rows = text("GIVE_CRYPTO")
    .split(/[\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      const value = rest.join("|").trim();
      return { label: (label ?? "").trim(), value };
    })
    .filter((row) => row.label && row.value);

  if (rows.length === 0) return null;

  return {
    id: "crypto",
    title: "Crypto",
    blurb: "Send to the address for that network.",
    details: rows,
    // A QR only where there is one address to encode; several would need one
    // QR each, which is the wallet card below rather than a single code.
    qr: rows.length === 1 ? rows[0]!.value : undefined,
    note: "Send only on the network named. A transfer on any other network cannot be recovered.",
  };
}

/** Every configured method, in the order a donor is most likely to want it. */
export function giveMethods(): GiveMethod[] {
  return [upi(), bank(), crypto()].filter((method): method is GiveMethod => method !== null);
}
