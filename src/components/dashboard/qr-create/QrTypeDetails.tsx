import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type QrTypeValue = "link" | "wifi" | "mail" | "contact" | "text" | "location";

export type WifiData = {
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "NONE";
};

export type MailData = {
  mail: string;
  subject: string;
  body: string;
};

export type LocationData = {
  latitude: string;
  longitude: string;
  label: string;
};

export type ContactData = {
  fullName: string;
  phone: string;
  mail: string;
  company: string;
  title: string;
};

export type QrTypeData = {
  link: string;
  wifi: WifiData;
  mail: MailData;
  contact: ContactData;
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

type MailDetailsProps = {
  value: MailData;
  onChange: (value: MailData) => void;
};

type ContactDetailsProps = {
  value: ContactData;
  onChange: (value: ContactData) => void;
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
        value={value.security}
        onValueChange={(security) => onChange({ ...value, security: security as WifiData["security"] })}
      >
        <SelectTrigger className="bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="WPA">WPA/WPA2</SelectItem>
          <SelectItem value="WEP">WEP</SelectItem>
          <SelectItem value="NONE">Şifresiz</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export const MailDetails = ({ value, onChange }: MailDetailsProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">E-posta Adresi</Label>
      <Input
        placeholder="ornek@email.com"
        className="bg-background"
        value={value.mail}
        onChange={(e) => onChange({ ...value, mail: e.target.value })}
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

export const ContactDetails = ({ value, onChange }: ContactDetailsProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Ad Soyad</Label>
      <Input
        placeholder="Tarik Ahmet"
        className="bg-background"
        value={value.fullName}
        onChange={(e) => onChange({ ...value, fullName: e.target.value })}
      />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Telefon</Label>
        <Input
          placeholder="+90 555 123 4567"
          className="bg-background"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">E-posta</Label>
        <Input
          placeholder="ornek@email.com"
          className="bg-background"
          value={value.mail}
          onChange={(e) => onChange({ ...value, mail: e.target.value })}
        />
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Şirket</Label>
        <Input
          placeholder="Algory"
          className="bg-background"
          value={value.company}
          onChange={(e) => onChange({ ...value, company: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Ünvan</Label>
        <Input
          placeholder="Software Engineer"
          className="bg-background"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </div>
    </div>
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
        value={value.latitude}
        onChange={(e) => onChange({ ...value, latitude: e.target.value })}
      />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Boylam</Label>
      <Input
        placeholder="28.9784"
        className="bg-background"
        value={value.longitude}
        onChange={(e) => onChange({ ...value, longitude: e.target.value })}
      />
    </div>
    <div className="space-y-2 sm:col-span-2">
      <Label className="text-xs text-muted-foreground">Etiket</Label>
      <Input
        placeholder="Ofis"
        className="bg-background"
        value={value.label}
        onChange={(e) => onChange({ ...value, label: e.target.value })}
      />
    </div>
  </div>
);

export const QrTypeDetails = ({ selectedType, data, onChange }: QrTypeDetailsProps) => {
  if (selectedType === "link") {
    return <UrlDetails value={data.link} onChange={(value) => onChange({ ...data, link: value })} />;
  }

  if (selectedType === "wifi") {
    return <WifiDetails value={data.wifi} onChange={(value) => onChange({ ...data, wifi: value })} />;
  }

  if (selectedType === "mail") {
    return <MailDetails value={data.mail} onChange={(value) => onChange({ ...data, mail: value })} />;
  }

  if (selectedType === "contact") {
    return <ContactDetails value={data.contact} onChange={(value) => onChange({ ...data, contact: value })} />;
  }

  if (selectedType === "text") {
    return <TextDetails value={data.text} onChange={(value) => onChange({ ...data, text: value })} />;
  }

  return <LocationDetails value={data.location} onChange={(value) => onChange({ ...data, location: value })} />;
};
