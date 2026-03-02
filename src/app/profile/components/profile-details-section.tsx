import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelect, type SelectOption } from "@/components/ui/smart-select";
import { cn } from "@/lib/utils";

import type { ProfileFormValues } from "../schema";

type HandleAvailability = "idle" | "checking" | "available" | "unavailable" | "invalid";

type ProfileDetailsSectionProps = {
  t: (key: string) => string;
  control: Control<ProfileFormValues>;
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  email: string;
  effectiveHandleAvailability: HandleAvailability;
  handleChanged: boolean;
  birthYearOptions: SelectOption[];
  birthMonthOptions: SelectOption[];
  countryOptions: SelectOption[];
  timezoneOptions: SelectOption[];
  onNext: () => void;
};

export default function ProfileDetailsSection({
  t,
  control,
  register,
  errors,
  email,
  effectiveHandleAvailability,
  handleChanged,
  birthYearOptions,
  birthMonthOptions,
  countryOptions,
  timezoneOptions,
  onNext,
}: ProfileDetailsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("sectionProfileTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("sectionProfileDescription")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="handle">
              {t("handleLabel")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="handle"
                {...register("handle", {
                  setValueAs: (value) =>
                    typeof value === "string" ? value.replace(/^@+/, "") : value,
                })}
                placeholder={t("handlePlaceholder")}
                className={cn("pl-7", errors.handle ? "border-destructive" : "")}
              />
            </div>
            {errors.handle ? (
              <p className="text-xs text-destructive">{errors.handle.message}</p>
            ) : null}
            {!errors.handle && effectiveHandleAvailability === "checking" ? (
              <p className="text-xs text-muted-foreground">{t("handleAvailabilityChecking")}</p>
            ) : null}
            {!errors.handle && handleChanged && effectiveHandleAvailability === "available" ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                {t("handleAvailabilityAvailable")}
              </p>
            ) : null}
            {!errors.handle && effectiveHandleAvailability === "unavailable" ? (
              <p className="text-xs text-destructive">{t("handleAvailabilityUnavailable")}</p>
            ) : null}
            {!errors.handle && effectiveHandleAvailability === "invalid" ? (
              <p className="text-xs text-destructive">{t("handleInvalidLengthHelper")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              readOnly
              value={email}
              className="bg-muted/40 text-muted-foreground focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birth-year">{t("birthYearLabel")}</Label>
            <Controller
              control={control}
              name="birthYear"
              render={({ field }) => (
                <SmartSelect
                  id="birth-year"
                  value={field.value}
                  options={birthYearOptions}
                  onValueChange={field.onChange}
                  placeholder={t("birthYearPlaceholder")}
                  searchPlaceholder={t("birthYearPlaceholder")}
                  searchAriaLabel={t("birthYearPlaceholder")}
                  className={cn(errors.birthYear ? "border-destructive" : "")}
                />
              )}
            />
            {errors.birthYear ? (
              <p className="text-xs text-destructive">{errors.birthYear.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth-month">{t("birthMonthLabel")}</Label>
            <Controller
              control={control}
              name="birthMonth"
              render={({ field }) => (
                <SmartSelect
                  id="birth-month"
                  value={field.value}
                  options={birthMonthOptions}
                  onValueChange={field.onChange}
                  placeholder={t("birthMonthPlaceholder")}
                  longListThreshold={13}
                  className={cn(errors.birthMonth ? "border-destructive" : "")}
                />
              )}
            />
            {errors.birthMonth ? (
              <p className="text-xs text-destructive">{errors.birthMonth.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="country">{t("countryLabel")}</Label>
            <Controller
              control={control}
              name="countryCode"
              render={({ field }) => (
                <SmartSelect
                  id="country"
                  value={field.value ?? ""}
                  options={countryOptions}
                  onValueChange={field.onChange}
                  placeholder={t("countryPlaceholder")}
                  searchPlaceholder={t("countryPlaceholder")}
                />
              )}
            />
          </div>
          <div className="space-y-2 min-w-0">
            <Label htmlFor="timezone">
              {t("timezoneLabel")} <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <SmartSelect
                  id="timezone"
                  value={field.value}
                  options={[{ value: "", label: t("timezonePlaceholder") }, ...timezoneOptions]}
                  onValueChange={field.onChange}
                  placeholder={t("timezonePlaceholder")}
                  searchPlaceholder={t("timezonePlaceholder")}
                />
              )}
            />
            {errors.timezone ? (
              <p className="text-xs text-destructive">{errors.timezone.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext} variant="secondary">
          {t("nextLanguage")}
        </Button>
      </div>
    </section>
  );
}
