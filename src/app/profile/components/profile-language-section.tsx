import { Controller, type Control, type UseFormRegister, type UseFormSetValue } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmartSelect, type SelectOption } from "@/components/ui/smart-select";

import type { ProfileFormValues } from "../schema";

type ProfileLanguageSectionProps = {
  t: (key: string) => string;
  control: Control<ProfileFormValues>;
  register: UseFormRegister<ProfileFormValues>;
  setValue: UseFormSetValue<ProfileFormValues>;
  languageOptions: SelectOption[];
  proficiencyLabels: Record<number, string>;
  languageFields: { id: string }[];
  languages: ProfileFormValues["languages"];
  languageErrorMessage?: string;
  onAddLanguage: () => void;
  onRemoveLanguage: (index: number) => void;
  onNext: () => void;
};

export default function ProfileLanguageSection({
  t,
  control,
  register,
  setValue,
  languageOptions,
  proficiencyLabels,
  languageFields,
  languages,
  languageErrorMessage,
  onAddLanguage,
  onRemoveLanguage,
  onNext,
}: ProfileLanguageSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("sectionLanguageTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("sectionLanguageDescription")}</p>
        </div>
        {languageErrorMessage ? (
          <p className="text-sm text-destructive">{languageErrorMessage}</p>
        ) : null}
        <div className="space-y-4">
          {languages.map((language, index) => (
            <div
              key={languageFields[index]?.id ?? `lang-${index}`}
              className="rounded-lg border border-border/60 p-4"
            >
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                <div className="space-y-2">
                  <Label className="whitespace-nowrap w-max inline-flex">{t("languageLabel")}</Label>
                  <Controller
                    control={control}
                    name={`languages.${index}.language_code`}
                    render={({ field }) => (
                      <SmartSelect
                        value={field.value}
                        options={languageOptions}
                        onValueChange={field.onChange}
                        placeholder={t("languagePlaceholder")}
                        searchPlaceholder={t("languageSearchPlaceholder")}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("levelLabel")}</Label>
                  <Controller
                    control={control}
                    name={`languages.${index}.level`}
                    render={({ field }) => (
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => {
                          const nextLevel = Number(value);
                          setValue(`languages.${index}.level`, nextLevel, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          if (nextLevel === 5) {
                            setValue(`languages.${index}.is_target`, false, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <SelectTrigger aria-label="Language level">
                          <SelectValue placeholder={t("levelLabel")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(proficiencyLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={() => onRemoveLanguage(index)}>
                    {t("removeButton")}
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Controller
                    control={control}
                    name={`languages.${index}.is_target`}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={field.value}
                        onChange={(event) => {
                          const isTarget = event.target.checked;
                          const currentLevel = languages[index]?.level ?? 0;
                          const nextLevel = isTarget && currentLevel === 5 ? 4 : currentLevel;
                          setValue(`languages.${index}.level`, nextLevel, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          field.onChange(isTarget);
                        }}
                      />
                    )}
                  />
                  {t("targetLanguage")}
                </label>
                <Input
                  {...register(`languages.${index}.description`)}
                  value={language.description ?? ""}
                  placeholder={t("languageDescriptionPlaceholder")}
                />
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={onAddLanguage}>
          {t("addLanguage")}
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={onNext}>
          {t("nextAvailability")}
        </Button>
      </div>
    </section>
  );
}
