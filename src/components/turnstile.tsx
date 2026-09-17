"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile, in its invisible mode.
 *
 * Nothing is drawn and nobody is asked to click a box: the widget writes a
 * hidden `cf-turnstile-response` input into the surrounding form, and the CMS
 * checks that token when the submission arrives. A visitor never knows it is
 * here, which is the point - the junk arriving in the inbox is not worth
 * making real people prove they are human.
 *
 * The site key comes from the CMS with the form definition, so turning this on
 * is a settings change there rather than a deploy here.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
    onTurnstileReady?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady";

export function Turnstile({ siteKey }: { siteKey: string }) {
  const holder = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !holder.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(holder.current, {
        sitekey: siteKey,
        // Invisible: solved in the background, no interaction, no layout.
        appearance: "interaction-only",
        // A token lasts five minutes. Someone can easily spend longer writing
        // a message, and an expired token would be read as a failed challenge,
        // so the widget quietly gets a new one instead.
        "refresh-expired": "auto",
      });
    };

    if (window.turnstile) {
      render();
    } else {
      window.onTurnstileReady = render;
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) {
        window.turnstile.remove(widget.current);
        widget.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={holder} />;
}
