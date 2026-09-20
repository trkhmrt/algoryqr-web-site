export type PrinterConnectionType = "LAN" | "USB" | "OS_DRIVER";
export type PrintTrigger = "CREATED" | "ACCEPTED";
export type MarketplacePrintSource = "YEMEK_SEPETI" | "UBER_EATS" | "QR";

export type PrinterSettings = {
  connectionType: PrinterConnectionType;
  lanHost: string;
  lanPort: number;
  autoPrint: boolean;
  autoPrintOn: PrintTrigger;
  sources: MarketplacePrintSource[];
  copies: number;
  cut: boolean;
};

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  connectionType: "LAN",
  lanHost: "",
  lanPort: 9100,
  autoPrint: true,
  autoPrintOn: "CREATED",
  sources: ["YEMEK_SEPETI", "UBER_EATS"],
  copies: 1,
  cut: true,
};
