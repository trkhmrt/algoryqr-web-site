import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { QrTypeValue } from "./QrTypeDetails";
import { LucideIcon } from "lucide-react";

type QrTypeOption = {
  value: QrTypeValue;
  label: string;
  icon: LucideIcon;
  desc?: string;
};

type QrTypeSelectorProps = {
  value: QrTypeValue;
  options: QrTypeOption[];
  onChange: (value: QrTypeValue) => void;
};

export function QrTypeSelector({ value, options, onChange }: QrTypeSelectorProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-2">
        <Select value={value} onValueChange={(next) => onChange(next as QrTypeValue)}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Tip seçin" />
          </SelectTrigger>
          <SelectContent>
            {options.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all ${
            value === type.value
              ? "border-foreground/30 bg-accent"
              : "border-border hover:border-foreground/15 hover:bg-accent/50"
          }`}
        >
          <type.icon className={`h-5 w-5 ${value === type.value ? "text-foreground" : "text-muted-foreground"}`} />
          <span className={`text-xs font-medium ${value === type.value ? "text-foreground" : "text-muted-foreground"}`}>
            {type.label}
          </span>
        </button>
      ))}
    </div>
  );
}
