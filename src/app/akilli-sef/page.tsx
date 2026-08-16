import type { Metadata } from "next";

import AkilliSefView from "@/views/AkilliSefView";

export const metadata: Metadata = {
  title: "Akıllı Şef | AlgoryQR",
  description:
    "Dijital menünüze gömülü yapay zeka asistanı. Misafirler soru sorar, kişiselleştirilmiş ürün önerileri alır ve görsel kartlarla siparişe yönlendirilir.",
};

export default function AkilliSefPage() {
  return <AkilliSefView />;
}
