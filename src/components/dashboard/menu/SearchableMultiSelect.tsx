"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { SearchableSelectOption } from "./SearchableSelect";

type SearchableMultiSelectProps = {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

export function SearchableMultiSelect({
  values,
  onValuesChange,
  options,
  placeholder = "Seçin",
  searchPlaceholder = "Ara...",
  emptyText = "Sonuç bulunamadı.",
  disabled = false,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  );

  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} ürün seçildi`;

  function toggleValue(value: string) {
    if (values.includes(value)) {
      onValuesChange(values.filter((entry) => entry !== value));
      return;
    }
    onValuesChange([...values, value]);
  }

  function removeValue(value: string) {
    onValuesChange(values.filter((entry) => entry !== value));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-between px-3 font-normal",
              selectedOptions.length === 0 && "text-muted-foreground",
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const selected = values.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      onSelect={() => toggleValue(option.value)}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-[220px] truncate">{option.label}</span>
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                aria-label={`${option.label} kaldır`}
                onClick={() => removeValue(option.value)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
