import { QrCode } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            Algory<span className="text-primary">QR</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 AlgoryQR. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
