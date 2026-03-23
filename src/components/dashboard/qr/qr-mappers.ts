import { UserQrApiItem } from "@/lib/api";
import { QrTypeData, QrTypeValue } from "@/components/dashboard/qr-create/QrTypeDetails";

export type DashboardQrItem = {
  id: number;
  userId: number;
  name: string;
  content: string;
  scans: number;
  created: string;
  type: string;
  active: boolean;
  imgSrc: string;
  details: Record<string, unknown>;
};

export const createInitialQrTypeData = (): QrTypeData => ({
  link: "",
  wifi: { ssid: "", password: "", security: "WPA" },
  mail: { mail: "", subject: "", body: "" },
  contact: { fullName: "", phone: "", mail: "", company: "", title: "" },
  text: "",
  location: { latitude: "", longitude: "", label: "" },
});

export const getQrDetailsByType = (type: QrTypeValue, data: QrTypeData) => {
  if (type === "link") return { url: data.link };
  if (type === "wifi") return data.wifi;
  if (type === "mail") return data.mail;
  if (type === "contact") return data.contact;
  if (type === "text") return { text: data.text };
  return data.location;
};

export const getBackendTypeFromDetails = (details: Record<string, unknown>): QrTypeValue => {
  if ("url" in details) return "link";
  if ("ssid" in details) return "wifi";
  if ("mail" in details && !("fullName" in details)) return "mail";
  if ("fullName" in details) return "contact";
  if ("text" in details) return "text";
  return "location";
};

export const mapDetailsToQrTypeData = (details: Record<string, unknown>): QrTypeData => {
  const base = createInitialQrTypeData();
  if ("url" in details) return { ...base, link: String(details.url ?? "") };

  if ("ssid" in details) {
    const securityRaw = String(details.security ?? "WPA");
    const security = (securityRaw === "WPA" || securityRaw === "WEP" || securityRaw === "NONE") ? securityRaw : "WPA";
    return {
      ...base,
      wifi: {
        ssid: String(details.ssid ?? ""),
        password: String(details.password ?? ""),
        security,
      },
    };
  }

  if ("mail" in details && !("fullName" in details)) {
    return {
      ...base,
      mail: {
        mail: String(details.mail ?? ""),
        subject: String(details.subject ?? ""),
        body: String(details.body ?? ""),
      },
    };
  }

  if ("fullName" in details) {
    return {
      ...base,
      contact: {
        fullName: String(details.fullName ?? ""),
        phone: String(details.phone ?? ""),
        mail: String(details.mail ?? ""),
        company: String(details.company ?? ""),
        title: String(details.title ?? ""),
      },
    };
  }

  if ("text" in details) return { ...base, text: String(details.text ?? "") };

  return {
    ...base,
    location: {
      latitude: String(details.latitude ?? ""),
      longitude: String(details.longitude ?? ""),
      label: String(details.label ?? ""),
    },
  };
};

export const getReadableDetailRows = (details: Record<string, unknown>) => {
  if ("url" in details) return [{ label: "Link", value: String(details.url ?? "") }];
  if ("ssid" in details) {
    return [
      { label: "SSID", value: String(details.ssid ?? "") },
      { label: "Güvenlik", value: String(details.security ?? "") },
    ];
  }
  if ("mail" in details && !("fullName" in details)) {
    return [
      { label: "Mail", value: String(details.mail ?? "") },
      { label: "Konu", value: String(details.subject ?? "") },
      { label: "Mesaj", value: String(details.body ?? "") },
    ];
  }
  if ("fullName" in details) {
    return [
      { label: "Ad Soyad", value: String(details.fullName ?? "") },
      { label: "Telefon", value: String(details.phone ?? "") },
      { label: "Mail", value: String(details.mail ?? "") },
      { label: "Şirket", value: String(details.company ?? "") },
      { label: "Ünvan", value: String(details.title ?? "") },
    ];
  }
  if ("text" in details) return [{ label: "Metin", value: String(details.text ?? "") }];
  if ("latitude" in details && "longitude" in details) {
    return [
      { label: "Enlem", value: String(details.latitude ?? "") },
      { label: "Boylam", value: String(details.longitude ?? "") },
      { label: "Etiket", value: String(details.label ?? "") },
    ];
  }
  return [];
};

const formatQrType = (details: Record<string, unknown>) => {
  if ("ssid" in details) return "WiFi";
  if ("url" in details) return "Link";
  if ("fullName" in details) return "İletişim";
  if ("mail" in details) return "E-Posta";
  if ("latitude" in details) return "Konum";
  if ("text" in details) return "Metin";
  return "QR";
};

const formatQrContent = (details: Record<string, unknown>) => {
  if ("url" in details) return String(details.url ?? "");
  if ("ssid" in details) return String(details.ssid ?? "");
  if ("mail" in details && !("fullName" in details)) return String(details.mail ?? "");
  if ("phone" in details && "fullName" in details) return String(details.phone ?? "");
  if ("text" in details) return String(details.text ?? "");
  if ("latitude" in details && "longitude" in details) {
    const label = "label" in details ? String(details.label ?? "") : "";
    const coords = `${String(details.latitude ?? "")}, ${String(details.longitude ?? "")}`;
    return label ? `${label} (${coords})` : coords;
  }
  return "Detay mevcut";
};

export const mapUserQrToDashboardItem = (qr: UserQrApiItem): DashboardQrItem => ({
  id: qr.qrId,
  userId: qr.userId,
  name: qr.qrName,
  content: formatQrContent(qr.details),
  scans: 0,
  created: new Date(qr.createdAt).toLocaleDateString("tr-TR"),
  type: formatQrType(qr.details),
  active: true,
  imgSrc: qr.imgSrc,
  details: qr.details,
});
