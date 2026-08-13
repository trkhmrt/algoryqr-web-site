"use client";

import { Copy, Download, QrCode, Share2 } from "lucide-react";

import {
  copyQrImageToClipboard,
  copyTextToClipboard,
  downloadQrImage,
  getQrDataUrl,
  shareQr,
} from "@/components/dashboard/qr/qr-actions";
import { Button } from "@/components/ui/button";
import { useDashboardBanners } from "@/contexts/dashboard-banners";

export type MenuQrPreviewProps = {
  imgSrc?: string | null;
  name: string;
  content: string;
};

export function MenuQrPreview({ imgSrc, name, content }: MenuQrPreviewProps) {
  const { notify } = useDashboardBanners();
  const dataUrl = getQrDataUrl(imgSrc ?? undefined);

  const handleDownload = () => {
    if (!imgSrc) {
      notify("warning", "İndirilecek QR görseli bulunamadı.");
      return;
    }
    const ok = downloadQrImage(imgSrc, name);
    if (ok) notify("info", "QR indirildi.");
    else notify("warning", "İndirme başarısız.");
  };

  const handleCopy = async () => {
    try {
      if (imgSrc) {
        const imageOk = await copyQrImageToClipboard(imgSrc);
        if (imageOk) {
          notify("info", "QR panoya kopyalandı.");
          return;
        }
      }
      const textOk = await copyTextToClipboard(content);
      if (textOk) {
        notify("info", "Menü linki panoya kopyalandı.");
        return;
      }
      notify("warning", "Kopyalama başarısız.");
    } catch {
      notify("warning", "Kopyalama başarısız.");
    }
  };

  const handleShare = async () => {
    try {
      const ok = await shareQr({
        title: name,
        text: content,
        imgSrc: imgSrc ?? undefined,
      });
      if (ok) {
        notify("info", "Paylaşım açıldı.");
        return;
      }
      const copied = await copyTextToClipboard(content);
      if (copied) {
        notify("warning", "Paylaşım desteklenmiyor; menü linki kopyalandı.");
        return;
      }
      notify("warning", "Paylaşım desteklenmiyor.");
    } catch {
      notify("warning", "Paylaşım iptal edildi veya başarısız.");
    }
  };

  return (
    <div className="flex w-[88px] shrink-0 flex-col items-center gap-1.5">
      <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
        {dataUrl ? (
          <img src={dataUrl} alt={`${name} QR kodu`} className="h-full w-full object-contain p-0.5" />
        ) : (
          <QrCode className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          title="İndir"
          aria-label="QR indir"
          onClick={handleDownload}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          title="Kopyala"
          aria-label="QR kopyala"
          onClick={() => void handleCopy()}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          title="Paylaş"
          aria-label="QR paylaş"
          onClick={() => void handleShare()}
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
