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
import { Controller, type Control, type UseFormRegister } from "react-hook-form";

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

  availabilityFields: any[];
  availability: ProfileFormValues["availability"];
  availabilityErrorMessage?: string;
  timezoneOptions: SelectOption[];
  weekdays: string[];
  onAddAvailability: () => void;
  onRemoveAvailability: (index: number) => void;
  onMoveAvailability: (from: number, to: number) => void;
};

type SortableAvailabilityRowProps = {
  id: string;
  children: ReactNode;
  handleLabel: string;
};


export function resolveAvailabilityReorder(items: string[], activeId: string, overId?: string | null) {
  if (!overId || activeId === overId) {
    return null;
  }
  const fromIndex = items.indexOf(activeId);
  const toIndex = items.indexOf(overId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return null;
  }
  return { fromIndex, toIndex };
}

function SortableAvailabilityRow({ id, children, handleLabel }: SortableAvailabilityRowProps) {
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

export default function ProfileAvailabilitySection({
  t,
  control,
  register,
  availabilityFields,
  availability,
  availabilityErrorMessage,
  timezoneOptions,
  weekdays,
  onAddAvailability,
  onRemoveAvailability,
  onMoveAvailability,
}: ProfileAvailabilitySectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const items = availabilityFields.map((field) => field.id);

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              const reorder = resolveAvailabilityReorder(
                items,
                String(active.id),
                over ? String(over.id) : null,
              );
              if (!reorder) {
                return;
              }
              onMoveAvailability(reorder.fromIndex, reorder.toIndex);
            }}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {availabilityFields.map((field, index) => {
                const slot = availability[index];
                if (!slot) {
                  return null;
                }
                const weekdaysLabelId = `availability-${index}-weekdays`;
                const startId = `availability-${index}-start`;
                const endId = `availability-${index}-end`;
                const timezoneId = `availability-${index}-timezone`;
                return (
                  <SortableAvailabilityRow
                    key={field.id}
                    id={field.id}
                    handleLabel={t("reorderHandleLabel")}
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label id={weekdaysLabelId}>{t("weekdaysLabel")}</Label>
                        <Controller
                          control={control}
                          name={`availability.${index}.weekdays`}
                          render={({ field: availabilityField }) => (
                            <ToggleGroup
                              type="multiple"
                              aria-labelledby={weekdaysLabelId}
                              variant="outline"
                              value={(availabilityField.value ?? []).map((day) => day.toString())}
                              onValueChange={(values) => {
                                const weekdaysSelected = values
                                  .map((value) => Number(value))
                                  .filter((value) => !Number.isNaN(value));
                                availabilityField.onChange(weekdaysSelected.sort());
                              }}
                              className="flex flex-wrap justify-start gap-2"
                            >
                              {weekdays.map((label, value) => (
                                <ToggleGroupItem key={label} value={value.toString()} aria-label={label}>
                                  {label.slice(0, 3)}
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          )}
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_minmax(0,2fr)_auto]">
                        <div className="space-y-2">
                          <Label htmlFor={startId}>{t("startLabel")}</Label>
                          <Input
                            id={startId}
                            type="time"
                            {...register(`availability.${index}.start_local_time`)}
                            defaultValue={(field as any).start_local_time ?? ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={endId}>{t("endLabel")}</Label>
                          <Input
                            id={endId}
                            type="time"
                            {...register(`availability.${index}.end_local_time`)}
                            defaultValue={(field as any).end_local_time ?? ""}
                          />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <Label htmlFor={timezoneId}>{t("availabilityTimezoneLabel")}</Label>
                          <Controller
                            control={control}
                            name={`availability.${index}.timezone`}
                            render={({ field: timezoneField }) => (
                              <SmartSelect
                                id={timezoneId}
                                value={timezoneField.value ?? ""}
                                onValueChange={timezoneField.onChange}
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
                  </SortableAvailabilityRow>
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
        <Button type="button" variant="secondary" onClick={onAddAvailability}>
          {t("addAvailability")}
        </Button>
      </div>
    </section>
  );
}
