import { Controller, type Control, type UseFormRegister, type UseFormSetValue } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelect, type SelectOption } from "@/components/ui/smart-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { ProfileFormValues } from "../schema";

type ProfileAvailabilitySectionProps = {
  t: (key: string) => string;
  control: Control<ProfileFormValues>;
  register: UseFormRegister<ProfileFormValues>;
  setValue: UseFormSetValue<ProfileFormValues>;
  availabilityFields: { id: string }[];
  availability: ProfileFormValues["availability"];
  availabilityErrorMessage?: string;
  timezoneOptions: SelectOption[];
  weekdays: string[];
  onAddAvailability: () => void;
  onRemoveAvailability: (index: number) => void;
};

export default function ProfileAvailabilitySection({
  t,
  control,
  register,
  setValue,
  availabilityFields,
  availability,
  availabilityErrorMessage,
  timezoneOptions,
  weekdays,
  onAddAvailability,
  onRemoveAvailability,
}: ProfileAvailabilitySectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("sectionAvailabilityTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("sectionAvailabilityDescription")}</p>
        </div>
        {availabilityErrorMessage ? (
          <p className="text-sm text-destructive">{availabilityErrorMessage}</p>
        ) : null}
        <div className="space-y-4">
          {availability.map((slot, index) => (
            <div
              key={availabilityFields[index]?.id ?? `slot-${index}`}
              className="rounded-lg border border-border/60 p-4"
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t("weekdaysLabel")}</Label>
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    value={slot.weekdays.map((day) => day.toString())}
                    onValueChange={(values) => {
                      const weekdaysSelected = values
                        .map((value) => Number(value))
                        .filter((value) => !Number.isNaN(value));
                      setValue(`availability.${index}.weekdays`, weekdaysSelected.sort(), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    className="flex flex-wrap justify-start gap-2"
                  >
                    {weekdays.map((label, value) => (
                      <ToggleGroupItem
                        key={label}
                        value={value.toString()}
                        aria-label={label}
                      >
                        {label.slice(0, 3)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_minmax(0,2fr)_auto]">
                  <div className="space-y-2">
                    <Label>{t("startLabel")}</Label>
                    <Input
                      type="time"
                      {...register(`availability.${index}.start_local_time`)}
                      value={slot.start_local_time}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("endLabel")}</Label>
                    <Input
                      type="time"
                      {...register(`availability.${index}.end_local_time`)}
                      value={slot.end_local_time}
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>{t("availabilityTimezoneLabel")}</Label>
                    <Controller
                      control={control}
                      name={`availability.${index}.timezone`}
                      render={({ field }) => (
                        <SmartSelect
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          options={timezoneOptions}
                          placeholder={t("availabilityTimezonePlaceholder")}
                          searchPlaceholder={t("availabilityTimezonePlaceholder")}
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" onClick={() => onRemoveAvailability(index)}>
                      {t("removeButton")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={onAddAvailability}>
          {t("addAvailability")}
        </Button>
      </div>
    </section>
  );
}
