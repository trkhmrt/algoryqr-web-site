import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type QrTypeValue = "url" | "wifi" | "email" | "phone" | "text" | "location";

export type WifiData = {
  ssid: string;
  password: string;
  encryption: "wpa" | "wep" | "none";
};

export type EmailData = {
  to: string;
  subject: string;
  body: string;
};

export type LocationData = {
  lat: string;
  lng: string;
};

export type QrTypeData = {
  url: string;
  wifi: WifiData;
  email: EmailData;
  phone: string;
  text: string;
  location: LocationData;
};

type UrlDetailsProps = {
  value: string;
  onChange: (value: string) => void;
};

type WifiDetailsProps = {
  value: WifiData;
  onChange: (value: WifiData) => void;
};

type EmailDetailsProps = {
  value: EmailData;
  onChange: (value: EmailData) => void;
};

type PhoneDetailsProps = {
  value: string;
  onChange: (value: string) => void;
};

type TextDetailsProps = {
  value: string;
  onChange: (value: string) => void;
};

type LocationDetailsProps = {
  value: LocationData;
  onChange: (value: LocationData) => void;
};

type QrTypeDetailsProps = {
  selectedType: QrTypeValue;
  data: QrTypeData;
  onChange: (data: QrTypeData) => void;
};

export const UrlDetails = ({ value, onChange }: UrlDetailsProps) => (
  <div className="space-y-2">
    <Label htmlFor="qr-url" className="text-xs text-muted-foreground">URL</Label>
    <Input
      id="qr-url"
      placeholder="https://example.com"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background"
    />
  </div>
);

export const WifiDetails = ({ value, onChange }: WifiDetailsProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Ağ Adı (SSID)</Label>
      <Input
        placeholder="MyNetwork"
        className="bg-background"
        value={value.ssid}
        onChange={(e) => onChange({ ...value, ssid: e.target.value })}
      />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Şifre</Label>
      <Input
        type="password"
        placeholder="••••••••"
        className="bg-background"
        value={value.password}
        onChange={(e) => onChange({ ...value, password: e.target.value })}
      />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Şifreleme</Label>
      <Select
        value={value.encryption}
        onValueChange={(encryption) => onChange({ ...value, encryption: encryption as WifiData["encryption"] })}
      >
        <SelectTrigger className="bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="wpa">WPA/WPA2</SelectItem>
          <SelectItem value="wep">WEP</SelectItem>
          <SelectItem value="none">Şifresiz</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export const EmailDetails = ({ value, onChange }: EmailDetailsProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">E-posta Adresi</Label>
      <Input
        placeholder="ornek@email.com"
        className="bg-background"
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Konu</Label>
      <Input
        placeholder="E-posta konusu"
        className="bg-background"
        value={value.subject}
        onChange={(e) => onChange({ ...value, subject: e.target.value })}
      />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Mesaj</Label>
      <Textarea
        placeholder="Mesaj içeriği..."
        className="bg-background resize-none"
        rows={3}
        value={value.body}
        onChange={(e) => onChange({ ...value, body: e.target.value })}
      />
    </div>
  </div>
);

export const PhoneDetails = ({ value, onChange }: PhoneDetailsProps) => (
  <div className="space-y-2">
    <Label className="text-xs text-muted-foreground">Telefon Numarası</Label>
    <Input
      placeholder="+90 555 123 4567"
      className="bg-background"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const TextDetails = ({ value, onChange }: TextDetailsProps) => (
  <div className="space-y-2">
    <Label className="text-xs text-muted-foreground">Metin İçeriği</Label>
    <Textarea
      placeholder="QR kodda gösterilecek metin..."
      className="bg-background resize-none"
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const LocationDetails = ({ value, onChange }: LocationDetailsProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Enlem</Label>
      <Input
        placeholder="41.0082"
        className="bg-background"
        value={value.lat}
        onChange={(e) => onChange({ ...value, lat: e.target.value })}
      />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Boylam</Label>
      <Input
        placeholder="28.9784"
        className="bg-background"
        value={value.lng}
        onChange={(e) => onChange({ ...value, lng: e.target.value })}
      />
    </div>
  </div>
);

export const QrTypeDetails = ({ selectedType, data, onChange }: QrTypeDetailsProps) => {
  if (selectedType === "url") {
    return <UrlDetails value={data.url} onChange={(value) => onChange({ ...data, url: value })} />;
  }

  if (selectedType === "wifi") {
    return <WifiDetails value={data.wifi} onChange={(value) => onChange({ ...data, wifi: value })} />;
  }

  if (selectedType === "email") {
    return <EmailDetails value={data.email} onChange={(value) => onChange({ ...data, email: value })} />;
  }

  if (selectedType === "phone") {
    return <PhoneDetails value={data.phone} onChange={(value) => onChange({ ...data, phone: value })} />;
  }

  if (selectedType === "text") {
    return <TextDetails value={data.text} onChange={(value) => onChange({ ...data, text: value })} />;
  }

  return <LocationDetails value={data.location} onChange={(value) => onChange({ ...data, location: value })} />;
};
