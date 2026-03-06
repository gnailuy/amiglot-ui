import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
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
  onMoveLanguage: (from: number, to: number) => void;
  onNext: () => void;
};

type SortableLanguageRowProps = {
  id: string;
  children: ReactNode;
  handleLabel: string;
};

function SortableLanguageRow({ id, children, handleLabel }: SortableLanguageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border/60 p-4 ${isDragging ? "bg-muted/40" : ""}`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:bg-muted"
          aria-label={handleLabel}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

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
  onMoveLanguage,
  onNext,
}: ProfileLanguageSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const items = languageFields.map((field) => field.id);

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) {
                return;
              }
              const fromIndex = items.indexOf(String(active.id));
              const toIndex = items.indexOf(String(over.id));
              if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
                return;
              }
              onMoveLanguage(fromIndex, toIndex);
            }}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {languageFields.map((field, index) => {
                const language = languages[index];
                if (!language) {
                  return null;
                }
                const languageId = `language-${index}-code`;
                const levelId = `language-${index}-level`;
                const descriptionId = `language-${index}-description`;
                return (
                  <SortableLanguageRow
                    key={field.id}
                    id={field.id}
                    handleLabel={t("reorderHandleLabel")}
                  >
                    <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                      <div className="space-y-2">
                        <Label className="whitespace-nowrap w-max inline-flex" htmlFor={languageId}>
                          {t("languageLabel")}
                        </Label>
                        <Controller
                          control={control}
                          name={`languages.${index}.language_code`}
                          render={({ field: languageField }) => (
                            <SmartSelect
                              id={languageId}
                              value={languageField.value}
                              options={languageOptions}
                              onValueChange={languageField.onChange}
                              placeholder={t("languagePlaceholder")}
                              searchPlaceholder={t("languageSearchPlaceholder")}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={levelId}>{t("levelLabel")}</Label>
                        <Controller
                          control={control}
                          name={`languages.${index}.level`}
                          render={({ field: levelField }) => (
                            <Select
                              value={
                                levelField.value !== undefined && levelField.value !== null
                                  ? levelField.value.toString()
                                  : ""
                              }
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
                              <SelectTrigger id={levelId} aria-label={t("levelLabel")}>
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
                          render={({ field: targetField }) => (
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={targetField.value}
                              onChange={(event) => {
                                const isTarget = event.target.checked;
                                const currentLevel = languages[index]?.level ?? 0;
                                const nextLevel = isTarget && currentLevel === 5 ? 4 : currentLevel;
                                setValue(`languages.${index}.level`, nextLevel, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                                targetField.onChange(isTarget);
                              }}
                            />
                          )}
                        />
                        {t("targetLanguage")}
                      </label>
                      <Label className="sr-only" htmlFor={descriptionId}>
                        {t("languageDescriptionPlaceholder")}
                      </Label>
                      <Input
                        id={descriptionId}
                        aria-label={t("languageDescriptionPlaceholder")}
                        {...register(`languages.${index}.description`)}
                        value={language.description ?? ""}
                        placeholder={t("languageDescriptionPlaceholder")}
                      />
                    </div>
                  </SortableLanguageRow>
                );
              })}
            </SortableContext>
          </DndContext>
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
