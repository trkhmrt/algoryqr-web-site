"use client";

import Link from "next/link";

import LegalPageShell from "@/components/LegalPageShell";
import { COMPANY } from "@/lib/company";

export default function RefundPolicyView() {
  return (
    <LegalPageShell title="Teslimat ve İade Şartları" eyebrow="İade">
      <h2>Teslimat</h2>
      <p>
        <strong>{COMPANY.productName}</strong> fiziksel ürün satmaz. Satın alınan paket ve
        abonelikler dijitaldir; ödeme onayı sonrası hesap üzerinden erişim sağlanır. Kargo veya
        adresli teslimat yoktur.
      </p>
      <h2>İptal ve iade</h2>
      <ul>
        <li>
          Uygun aboneliklerde hesap panelinden <strong>hemen iade</strong> veya{" "}
          <strong>dönem sonunda bitirme</strong> seçenekleri sunulabilir.
        </li>
        <li>
          Hemen iade seçildiğinde paket kullanım hakları sonlandırılır; iade tutarı ödeme
          yöntemine, banka süreçlerine bağlı olarak birkaç iş günü içinde yansır.
        </li>
        <li>
          Dönem sonunda bitirme seçildiğinde dönem sonuna kadar erişim devam eder; bu seçenekte
          kural olarak iade yapılmaz ve sonraki dönem için ücret alınmaz.
        </li>
        <li>Deneme veya ücretsiz paketlerde ücret iadesi söz konusu değildir.</li>
      </ul>
      <h2>Başarısız / mükerrer ödemeler</h2>
      <p>
        Teknik bir nedenle mükerrer tahsilat oluşursa destek ekibimizle iletişime geçin; gerekli
        iade işlemleri yürütülür.
      </p>
      <h2>İletişim</h2>
      <p>
        İade talepleri ve sorularınız için:{" "}
        <Link href={COMPANY.emailMailto}>{COMPANY.email}</Link>
        <br />
        Ticaret unvanı: {COMPANY.tradeName}
      </p>
      <p>
        Ayrıca <Link href="/mesafeli-satis">Mesafeli Satış Sözleşmesi</Link> ve{" "}
        <Link href="/gizlilik">Gizlilik Politikası</Link> sayfalarını inceleyebilirsiniz.
      </p>
      <p className="text-xs">Son güncelleme: Ağustos 2026</p>
    </LegalPageShell>
  );
}
