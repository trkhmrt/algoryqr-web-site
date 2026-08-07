"use client";

import Link from "next/link";

import LegalPageShell from "@/components/LegalPageShell";
import { COMPANY } from "@/lib/company";

export default function DistanceSalesView() {
  return (
    <LegalPageShell title="Mesafeli Satış Sözleşmesi" eyebrow="Sözleşme">
      <p>
        Bu sözleşme, <strong>{COMPANY.tradeName}</strong> (“Satıcı”) ile {COMPANY.productName}{" "}
        platformundan dijital paket / abonelik satın alan kullanıcı (“Alıcı”) arasında, mesafeli
        satış hükümleri çerçevesinde düzenlenmiştir.
      </p>
      <h2>1. Taraflar</h2>
      <p>
        Satıcı: {COMPANY.tradeName}
        <br />
        E-posta: <Link href={COMPANY.emailMailto}>{COMPANY.email}</Link>
        <br />
        Alıcı: Satın alma sırasında sisteme kaydedilen hesap ve fatura bilgileri esas alınır.
      </p>
      <h2>2. Konu</h2>
      <p>
        Sözleşmenin konusu; Alıcı’nın seçtiği dijital paket veya aboneliğin (QR oluşturma hakları,
        dijital menü özellikleri vb.) elektronik ortamda sunulması ve bedelinin tahsilidir. Fiziksel
        ürün teslimatı yapılmaz.
      </p>
      <h2>3. Hizmetin ifası</h2>
      <p>
        Ödeme başarıyla tamamlandığında ilgili paket hakları Alıcı hesabında aktif edilir. Hizmet,
        elektronik ortamda anında ifa edilen dijital içerik / yazılım hizmeti niteliğindedir.
      </p>
      <h2>4. Bedel ve ödeme</h2>
      <p>
        Güncel paket bedelleri satın alma ekranında gösterilir. Ödeme, iyzico ödeme altyapısı
        üzerinden kredi / banka kartı ile alınır. Aboneliklerde yenileme koşulları paket
        bilgilendirmesinde belirtilir.
      </p>
      <h2>5. Cayma ve iade</h2>
      <p>
        Dijital hizmetin ifasına Alıcı onayıyla başlanmış olması halinde, ilgili mevzuat
        çerçevesinde cayma hakkı sınırlı olabilir. İade ve iptal koşulları için{" "}
        <Link href="/iade">Teslimat ve İade Şartları</Link> sayfasına bakınız.
      </p>
      <h2>6. Uyuşmazlık</h2>
      <p>
        Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır; tüketici işlemlerinde ilgili tüketici
        hakem heyeti ve mahkemeler yetkilidir.
      </p>
      <p className="text-xs">Son güncelleme: Ağustos 2026</p>
    </LegalPageShell>
  );
}
