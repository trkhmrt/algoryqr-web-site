"use client";

import Link from "next/link";

import LegalPageShell from "@/components/LegalPageShell";
import { COMPANY } from "@/lib/company";

export default function PrivacyView() {
  return (
    <LegalPageShell title="Gizlilik Politikası" eyebrow="KVKK">
      <p>
        Bu gizlilik politikası, <strong>{COMPANY.tradeName}</strong> tarafından işletilen{" "}
        <strong>{COMPANY.productName}</strong> platformunda işlenen kişisel verilere ilişkindir.
        Veri sorumlusu: {COMPANY.tradeName}. İletişim:{" "}
        <Link href={COMPANY.emailMailto}>{COMPANY.email}</Link>,{" "}
        <Link href={COMPANY.phoneTel}>{COMPANY.phone}</Link>.
      </p>
      <h2>Toplanan veriler</h2>
      <ul>
        <li>Hesap bilgileri: ad, soyad, e-posta, telefon (kayıt sırasında verdiğiniz ölçüde)</li>
        <li>Fatura ve fatura adresi bilgileri</li>
        <li>Ödeme işlemine ilişkin teknik kayıtlar (ödeme sağlayıcısı üzerinden)</li>
        <li>Kullanım ve analitik verileri (menü görüntüleme, oturum bilgileri)</li>
        <li>Destek taleplerinizde paylaştığınız içerikler</li>
      </ul>
      <h2>Ödeme ve kart verileri</h2>
      <p>
        Kart numarası ve CVV gibi hassas ödeme verileri sunucularımızda saklanmaz. Ödemeler{" "}
        <strong>PayTR</strong> altyapısı üzerinden gerçekleştirilir; kart saklama kullanıldığında
        yalnızca PayTR token’ı tutulabilir.
      </p>
      <h2>İşleme amaçları</h2>
      <ul>
        <li>Hizmetin sunulması, paket/abonelik yönetimi ve müşteri desteği</li>
        <li>Ödeme tahsilatı, faturalandırma ve yasal yükümlülükler</li>
        <li>Güvenlik, dolandırıcılık önleme ve hizmet iyileştirme</li>
      </ul>
      <h2>Saklama ve güvenlik</h2>
      <p>
        Veriler, hizmetin gerektirdiği süre ve ilgili mevzuatın öngördüğü sürelerle sınırlı olarak
        saklanır. Erişim, yetkilendirme ve güvenli iletişim (HTTPS) ile korunur.
      </p>
      <h2>Çerezler ve oturum</h2>
      <p>
        Oturum yönetimi, güvenlik ve temel işlevsellik için çerez / benzeri teknolojiler
        kullanılabilir. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz; bazı özellikler
        etkilenebilir.
      </p>
      <h2>Haklarınız</h2>
      <p>
        KVKK kapsamında veri erişim, düzeltme, silme ve itiraz haklarınız için{" "}
        <Link href={COMPANY.emailMailto}>{COMPANY.email}</Link> adresine başvurabilirsiniz.
      </p>
      <p className="text-xs">Son güncelleme: Ağustos 2026</p>
    </LegalPageShell>
  );
}
