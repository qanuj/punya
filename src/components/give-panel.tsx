"use client";

import { useCallback, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { PayOnline, type View } from "@/components/pay-online";
import { BANK, GIVING_EMAIL, UPI, upiLink } from "@/lib/giving";

/**
 * Every way to give, in one card.
 *
 * Online first, because it is the only one that confirms itself and the only
 * one that can issue a receipt without somebody emailing a screenshot. The
 * three direct methods sit under a hairline in the same card rather than in
 * cards of their own: they are the same decision seen from a different app,
 * not three more things to read.
 *
 * None of this comes from the CMS. An editor owns the words around giving;
 * where the money lands is a commit.
 */

type Method = "qr" | "upi" | "bank";

const METHODS: { key: Method; label: string }[] = [
  { key: "qr", label: "UPI QR" },
  { key: "upi", label: "UPI id" },
  { key: "bank", label: "Bank transfer" },
];

export function GivePanel() {
  const [open, setOpen] = useState<Method | null>(null);
  /*
   * Once a gift lands, the card is a thank-you and nothing else. A heading
   * asking for money above it, and three more ways to pay below it, would
   * both be asking a person who has just given.
   */
  const [settled, setSettled] = useState(false);
  const onView = useCallback((at: View["at"]) => setSettled(at !== "form"), []);

  return (
    <div className="give">
      {!settled && (
        <>
          <h2 className="give-title">Give to the gaushala</h2>
          <p className="give-lede">
            Every rupee goes to the daily care of the cows at Patkhauli Gaushala.
          </p>
        </>
      )}

      <PayOnline framed={false} onView={onView} />

      {!settled && (
        <div className="give-direct">
          <div className="give-tabs" role="tablist" aria-label="Pay directly instead">
            {METHODS.map((method) => (
              <button
                key={method.key}
                type="button"
                role="tab"
                id={`give-tab-${method.key}`}
                aria-controls={`give-panel-${method.key}`}
                aria-selected={open === method.key}
                className="give-tab"
                onClick={() => setOpen(open === method.key ? null : method.key)}
              >
                {method.label}
              </button>
            ))}
          </div>

          {METHODS.map((method) => (
            <div
              key={method.key}
              className="give-reveal"
              data-open={open === method.key}
              // Kept in the tree so the open transition has a height to grow to,
              // and hidden from assistive tech while it is closed.
              aria-hidden={open !== method.key}
            >
              <div>
                <div
                  role="tabpanel"
                  id={`give-panel-${method.key}`}
                  aria-labelledby={`give-tab-${method.key}`}
                >
                  {method.key === "qr" && <QrMethod />}
                  {method.key === "upi" && <UpiMethod />}
                  {method.key === "bank" && <BankMethod />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QrMethod() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="give-qr"
        src={UPI.qr}
        alt={`UPI QR code for ${BANK.accountName}`}
        width={180}
        height={180}
        loading="lazy"
      />
      <p className="give-fineprint" style={{ textAlign: "center" }}>
        Scan with GPay, PhonePe, Paytm, BHIM or your bank&rsquo;s app, and enter any amount.
      </p>
    </>
  );
}

function UpiMethod() {
  return (
    <>
      <dl className="give-rows">
        <Row label="UPI id" value={UPI.id} />
        <Row label="Payee" value={BANK.accountName} copy={false} />
      </dl>
      <a className="btn btn-outline give-submit" href={upiLink()}>
        Open your UPI app
      </a>
      <p className="give-fineprint">
        A gift sent this way reaches the Trust without passing through this website, so it cannot be
        receipted automatically. Send the reference to {GIVING_EMAIL} and one will follow.
      </p>
    </>
  );
}

function BankMethod() {
  return (
    <>
      <dl className="give-rows">
        <Row label="Account name" value={BANK.accountName} copy={false} />
        <Row label="Account number" value={BANK.accountNumber} />
        <Row label="IFSC" value={BANK.ifsc} />
        <Row label="Bank" value={`${BANK.bank}, ${BANK.branch}`} copy={false} />
      </dl>
      <p className="give-fineprint">
        NEFT, IMPS or RTGS from any Indian bank. Send the transaction reference (UTR) to{" "}
        {GIVING_EMAIL} with your name and the Trust will send a receipt.
      </p>
    </>
  );
}

function Row({ label, value, copy = true }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="give-row">
      <dt>{label}</dt>
      <dd>
        {value}
        {copy && <CopyButton value={value} label={label} />}
      </dd>
    </div>
  );
}
