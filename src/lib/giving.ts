/**
 * Where a gift actually lands.
 *
 * These were CMS content for a while, which meant anybody who could edit a
 * page could change the account a donation goes to. They are public facts -
 * printed on the page, scanned off a QR - but they are not editorial, so they
 * live in the repository where changing them is a reviewed commit.
 *
 * The online gateway's keys are not here either. Those are in TinTorch
 * Account, which is the only service that ever holds a merchant secret.
 */

export const TRUST_NAME = "Punya Charitable Trust";

export const UPI = {
  id: "SBIBHIM.INSTANT97993723766722673@sbipay",
  /** A bank-issued static QR for the same id. */
  qr: "https://media.tintorch.com/content/w/punya/page/inline-502ad1f5-846b-4600-acbc-7b813133d52c.png",
} as const;

/** Opens the payer's own UPI app with the Trust already filled in. */
export const upiLink = (amount?: number): string => {
  const params = new URLSearchParams({ pa: UPI.id, pn: TRUST_NAME, cu: "INR" });
  // An amount is a suggestion here: every UPI app lets the payer edit it.
  if (amount && amount > 0) params.set("am", String(amount));
  return `upi://pay?${params.toString()}`;
};

export const BANK = {
  accountName: TRUST_NAME,
  accountNumber: "45588585360",
  ifsc: "SBIN0002552",
  bank: "State Bank of India",
  branch: "Industrial Estate, Varanasi",
} as const;

export const GIVING_EMAIL = "hello@punya.ngo";

/**
 * Where a payer goes after giving. The CMS slug, not the spelling in prose:
 * `/gaushalas/patkholi` only resolves through an old-slug redirect.
 */
export const GAUSHALA_PATH = "/gaushalas/pathkoli";

/** The page the give panel belongs on. Code decides this, not the CMS. */
export const GIVE_PAGE_SLUG = "donate";
