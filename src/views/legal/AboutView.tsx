"use client";

import Link from "next/link";

import LegalPageShell from "@/components/LegalPageShell";
import { COMPANY } from "@/lib/company";
import { Tx } from "@/components/google-translate-provider";

export default function AboutView() {
  return (
    <LegalPageShell title="Hakkımızda" eyebrow="AlgoryQR">
      <p>
        <Tx>{`${COMPANY.tradeName}, dijital işletme çözümleri geliştiren bir teknoloji markasıdır. Ürünümüz ${COMPANY.productName}; restoranlar, kafeler ve hizmet işletmeleri için dinamik QR kod, dijital menü ve yapay zeka destekli araçlar (Akıllı Özet, Akıllı Asistan, Akıllı Raporlama) sunar.`}</Tx>
      </p>
      <h2>
        <Tx>Ne sunuyoruz?</Tx>
      </h2>
      <ul>
        <li>
          <Tx>Özelleştirilebilir dijital menü şablonları</Tx>
        </li>
        <li>
          <Tx>Dinamik QR kod oluşturma ve yönetimi</Tx>
        </li>
        <li>
          <Tx>Akıllı Özet ile yapay zeka destekli ürün açıklamaları</Tx>
        </li>
        <li>
          <Tx>Akıllı Asistan ile menü üzerinden misafir desteği</Tx>
        </li>
        <li>
          <Tx>Akıllı Raporlama ile ziyaret ve ürün analizleri</Tx>
        </li>
        <li>
          <Tx>Paket ve abonelik tabanlı kullanım hakları</Tx>
        </li>
      </ul>
      <h2>
        <Tx>Hizmet modeli</Tx>
      </h2>
      <p>
        <Tx>{`${COMPANY.productName} tamamen dijital bir SaaS hizmetidir. Fiziksel ürün teslimatı yapılmaz; satın alınan paketler hesap üzerinden anında aktif edilir.`}</Tx>
      </p>
      <h2>
        <Tx>İletişim</Tx>
      </h2>
      <p>
        <Tx>Ticaret unvanı:</Tx> <strong>{COMPANY.tradeName}</strong>
        <br />
        <Tx>E-posta:</Tx>{" "}
        <Link href={COMPANY.emailMailto}>{COMPANY.email}</Link>
        <br />
        <Tx>Telefon:</Tx>{" "}
        <Link href={COMPANY.phoneTel}>{COMPANY.phone}</Link>
      </p>
    </LegalPageShell>
  );
}
