"use client";

import { useEffect, useRef } from "react";

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
  onCloseRef.current = onClose;

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
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
          className="w-full flex-1 border-0 bg-white"
          sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
        />
      ) : (
        <iframe
          ref={iframeRef}
          key={`pay-html-${purchaseId ?? "inline"}`}
          title={title}
          srcDoc={overlay.content}
          className="w-full flex-1 border-0 bg-white"
          sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
        />
      )}
    </div>
  );
}
