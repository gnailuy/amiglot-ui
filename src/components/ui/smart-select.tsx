"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectOption = {
  value: string;
  label: string;
};

type SmartSelectProps = {
  id?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  longListThreshold?: number;
// searchAriaLabel?: string;
};

const DEFAULT_LONG_LIST_THRESHOLD = 10;

function SearchableSelect({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search",
  emptyText = "No matches found.",
  className,
// searchAriaLabel = "Search options",
}: Omit<SmartSelectProps, "longListThreshold" | "searchAriaLabel">) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[var(--radix-popover-content-available-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SimpleSelect({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  className,
}: Omit<SmartSelectProps, "longListThreshold" | "searchPlaceholder" | "emptyText" | "searchAriaLabel">) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          if (option.value === "") return null;
          return (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function SmartSelect({
  longListThreshold = DEFAULT_LONG_LIST_THRESHOLD,
  options,
  ...props
}: SmartSelectProps) {
  const hasEmptyOption = options.some(o => o.value === "");
  const useSearchable = options.length > longListThreshold || hasEmptyOption;

  if (useSearchable) {
    return <SearchableSelect options={options} {...props} />;
  }
  return <SimpleSelect options={options} {...props} />;
}
