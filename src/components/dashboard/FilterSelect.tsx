"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterSelectOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  className?: string;
};

export function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  className,
}: FilterSelectProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <label className="text-xs text-muted-foreground">{label}</label> : null}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
