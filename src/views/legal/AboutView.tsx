"use client";

import Link from "next/link";

import LegalPageShell from "@/components/LegalPageShell";
import { COMPANY } from "@/lib/company";

export default function AboutView() {
  return (
    <LegalPageShell title="Hakkımızda" eyebrow="AlgoryQR">
      <p>
        <strong>{COMPANY.tradeName}</strong>, dijital işletme çözümleri geliştiren bir teknoloji
        markasıdır. Ürünümüz <strong>{COMPANY.productName}</strong>; restoranlar, kafeler ve hizmet
        işletmeleri için dinamik QR kod, dijital menü ve yapay zeka destekli araçlar (Akıllı Özet,
        Akıllı Asistan, Akıllı Raporlama) sunar.
      </p>
      <h2>Ne sunuyoruz?</h2>
      <ul>
        <li>Özelleştirilebilir dijital menü şablonları</li>
        <li>Dinamik QR kod oluşturma ve yönetimi</li>
        <li>Akıllı Özet ile yapay zeka destekli ürün açıklamaları</li>
        <li>Akıllı Asistan ile menü üzerinden misafir desteği</li>
        <li>Akıllı Raporlama ile ziyaret ve ürün analizleri</li>
        <li>Paket ve abonelik tabanlı kullanım hakları</li>
      </ul>
      <h2>Hizmet modeli</h2>
      <p>
        {COMPANY.productName} tamamen dijital bir SaaS hizmetidir. Fiziksel ürün teslimatı
        yapılmaz; satın alınan paketler hesap üzerinden anında aktif edilir.
      </p>
      <h2>İletişim</h2>
      <p>
        Ticaret unvanı: <strong>{COMPANY.tradeName}</strong>
        <br />
        E-posta:{" "}
        <Link href={COMPANY.emailMailto}>{COMPANY.email}</Link>
        <br />
        Telefon:{" "}
        <Link href={COMPANY.phoneTel}>{COMPANY.phone}</Link>
      </p>
    </LegalPageShell>
  );
}
