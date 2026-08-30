"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export type PaymentCheckoutOverlayContent =
  | { kind: "url"; content: string }
  | { kind: "html"; content: string };

type PaymentCheckoutOverlayProps = {
  overlay: PaymentCheckoutOverlayContent;
  purchaseId?: number | null;
  title: string;
  onClose: () => void;
};

function blankIframe(iframe: HTMLIFrameElement | null) {
  if (!iframe) return;
  try {
    iframe.src = "about:blank";
  } catch {
    /* ignore */
  }
}

export default function PaymentCheckoutOverlay({
  overlay,
  purchaseId,
  title,
  onClose,
}: PaymentCheckoutOverlayProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const historyPushedRef = useRef(false);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [portalReady, setPortalReady] = useState(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => setPortalReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const closeSafely = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    blankIframe(iframeRef.current);
    onCloseRef.current();
  };

  useEffect(() => {
    historyPushedRef.current = true;
    window.history.pushState({ algoryPaymentOverlay: purchaseId ?? true }, "");
    const handlePopState = () => closeSafely();
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      blankIframe(iframeRef.current);
    };
  }, [purchaseId]);

  const handleCancelClick = () => {
    blankIframe(iframeRef.current);
    if (historyPushedRef.current) {
      historyPushedRef.current = false;
      closingRef.current = true;
      window.history.back();
      onCloseRef.current();
      return;
    }
    closeSafely();
  };

  return portalReady
    ? createPortal(
        <div className="fixed inset-0 z-[9998] flex flex-col bg-background">
          <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLogo size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{title}</p>
                <p className="truncate text-xs text-muted-foreground">AlgoryQR güvenli ödeme</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancelClick}>
              İptal
            </Button>
          </div>
          {overlay.kind === "url" ? (
            <iframe
              ref={iframeRef}
              key={`pay-url-${purchaseId ?? overlay.content}`}
              title={title}
              src={overlay.content}
              className="min-h-0 w-full flex-1 border-0 bg-white"
              sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
            />
          ) : (
            <iframe
              ref={iframeRef}
              key={`pay-html-${purchaseId ?? "inline"}`}
              title={title}
              srcDoc={overlay.content}
              className="min-h-0 w-full flex-1 border-0 bg-white"
              sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
            />
          )}
        </div>,
        document.body,
      )
    : null;
}
