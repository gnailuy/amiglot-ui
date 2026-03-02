import { z } from "zod";

export const HANDLE_PATTERN = /^[a-zA-Z0-9]+$/;
export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;
export const BIRTH_YEAR_MIN = 1900;
export const UNSET_SELECT_VALUE = "__unset__";

const isUnset = (value: string) => value === UNSET_SELECT_VALUE || value.trim() === "";

export const createProfileSchema = (t: (key: string) => string) =>
  z
    .object({
      handle: z
        .string()
        .trim()
        .min(1, t("handleRequired"))
        .regex(HANDLE_PATTERN, t("handleInvalidCharacters"))
        .min(HANDLE_MIN_LENGTH, t("handleInvalidLength"))
        .max(HANDLE_MAX_LENGTH, t("handleInvalidLength")),
      birthYear: z
        .string()
        .refine(
          (value) => {
            if (isUnset(value)) {
              return true;
            }
            const year = Number(value);
            const currentYear = new Date().getFullYear();
            return Number.isFinite(year) && year >= BIRTH_YEAR_MIN && year <= currentYear;
          },
          { message: t("birthYearInvalid") },
        ),
      birthMonth: z
        .string()
        .refine(
          (value) => {
            if (isUnset(value)) {
              return true;
            }
            const month = Number(value);
            return Number.isFinite(month) && month >= 1 && month <= 12;
          },
          { message: t("birthMonthInvalid") },
        ),
      countryCode: z.string().optional(),
      timezone: z.string().trim().min(1, t("timezoneInvalid")),
      languages: z
        .array(
          z.object({
            language_code: z.string(),
            level: z.number().min(0).max(5),
            is_target: z.boolean(),
            description: z.string().optional(),
          }),
        )
        .min(1, t("languagesRequired")),
      availability: z.array(
        z.object({
          weekdays: z
            .array(z.number().int().min(0).max(6))
            .min(1, t("availabilityWeekdayRequired")),
          start_local_time: z.string().min(1, t("availabilityTimeRequired")),
          end_local_time: z.string().min(1, t("availabilityTimeRequired")),
          timezone: z.string().optional(),
        }),
      ),
    })
    .superRefine((values, ctx) => {
      const normalizedCodes = values.languages.map((lang) => lang.language_code.trim().toLowerCase());

      if (normalizedCodes.some((code) => !code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["languages"],
          message: t("languagesEmpty"),
        });
      }

      const seen = new Set<string>();
      if (normalizedCodes.some((code) => (code ? (seen.has(code) ? true : (seen.add(code), false)) : false))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["languages"],
          message: t("languagesDuplicate"),
        });
      }

      const nativeCount = values.languages.filter((lang) => lang.level === 5).length;
      if (nativeCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["languages"],
          message: t("languagesNativeRequired"),
        });
      }

      values.availability.forEach((slot, index) => {
        if (!slot.start_local_time || !slot.end_local_time) {
          return;
        }
        if (slot.start_local_time >= slot.end_local_time) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["availability", index, "end_local_time"],
            message: t("availabilityTimeRequired"),
          });
        }
      });
    });

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;
