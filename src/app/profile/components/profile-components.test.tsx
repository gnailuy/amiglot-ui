/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import React from "react";

import type { ProfileFormValues } from "../schema";

import ProfileAvailabilitySection from "./profile-availability-section";
import ProfileDetailsSection from "./profile-details-section";
import ProfileLanguageSection from "./profile-language-section";

describe("Profile Components Coverage", () => {
  const t = (k: string) => k;

  it("ProfileDetailsSection interaction", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();

    const TestComponent = () => {
      const methods = useForm<ProfileFormValues>({
        defaultValues: {
          handle: "testuser",
          birthYear: "",
          birthMonth: "",
          countryCode: "",
          timezone: "",
          languages: [],
          availability: [],
        },
      });
      return (
        <ProfileDetailsSection
          t={t}
          control={methods.control}
          register={methods.register}
          errors={{}}
          email="test@example.com"
          effectiveHandleAvailability="available"
          handleChanged={true}
          birthYearOptions={[{ value: "2000", label: "2000" }]}
          birthMonthOptions={[{ value: "1", label: "Jan" }]}
          countryOptions={[{ value: "US", label: "United States" }]}
          timezoneOptions={[{ value: "UTC", label: "UTC" }]}
          onNext={onNext}
        />
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByText("handleAvailabilityAvailable")).toBeInTheDocument();
    
    await user.click(screen.getByText("nextLanguage"));
    expect(onNext).toHaveBeenCalled();
  });

  it("ProfileDetailsSection shows loading", () => {
    render(<ProfileDetailsSection t={t} control={{} as any} register={{} as any} errors={{}} email="" effectiveHandleAvailability="idle" handleChanged={false} loading={true} discoverable={null} birthYearOptions={[]} birthMonthOptions={[]} countryOptions={[]} timezoneOptions={[]} onNext={() => {}} />);
    expect(screen.getByText("loadingProfile")).toBeInTheDocument();
  });

  it("ProfileDetailsSection shows error states", () => {
    render(<ProfileDetailsSection t={t} control={{} as any} register={() => ({})} errors={{ handle: { message: "Handle Error" } } as any} email="" effectiveHandleAvailability="invalid" handleChanged={false} loading={false} discoverable={null} birthYearOptions={[]} birthMonthOptions={[]} countryOptions={[]} timezoneOptions={[]} onNext={() => {}} />);
    expect(screen.getByText("Handle Error")).toBeInTheDocument();
  });


  it("ProfileLanguageSection shows errors", () => {
    const methods = { control: {}, register: () => {}, setValue: () => {} };
    render(<ProfileLanguageSection t={t} control={methods.control as any} register={methods.register as any} setValue={methods.setValue as any} errors={{}} languageErrorMessage="Language Error" languageOptions={[]} proficiencyLabels={{}} languageFields={[]} languages={[]} onAddLanguage={() => {}} onRemoveLanguage={() => {}} onNext={() => {}} />);
    expect(screen.getByText("Language Error")).toBeInTheDocument();
  });

  it("ProfileLanguageSection interaction", async () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onNext = vi.fn();
    const user = userEvent.setup();

    const TestComponent = () => {
      const methods = useForm<ProfileFormValues>({
        defaultValues: {
          handle: "testuser",
          birthYear: "",
          birthMonth: "",
          countryCode: "",
          timezone: "",
          languages: [
            { language_code: "en", level: 5, is_target: false, description: "" }
          ],
          availability: [],
        },
      });
      return (
        <ProfileLanguageSection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          languageOptions={[{ value: "en", label: "English" }]}
          proficiencyLabels={{ 5: "Native" }}
          languageFields={[{ id: "1" }]}
          languages={methods.getValues("languages")}
          onAddLanguage={onAdd}
          onRemoveLanguage={onRemove}
          onNext={onNext}
        />
      );
    };

    render(<TestComponent />);

    await user.click(screen.getByText("addLanguage"));
    expect(onAdd).toHaveBeenCalled();
    
    await user.click(screen.getByText("removeButton"));
    expect(onRemove).toHaveBeenCalledWith(0);
    
    await user.click(screen.getByText("nextAvailability"));
    expect(onNext).toHaveBeenCalled();
  });

  it("ProfileDetailsSection shows loading", () => {
    render(<ProfileDetailsSection t={t} control={{} as any} register={{} as any} errors={{}} email="" effectiveHandleAvailability="idle" handleChanged={false} loading={true} discoverable={null} birthYearOptions={[]} birthMonthOptions={[]} countryOptions={[]} timezoneOptions={[]} onNext={() => {}} />);
    expect(screen.getByText("loadingProfile")).toBeInTheDocument();
  });

  it("ProfileDetailsSection shows error states", () => {
    render(<ProfileDetailsSection t={t} control={{} as any} register={() => ({})} errors={{ handle: { message: "Handle Error" } } as any} email="" effectiveHandleAvailability="invalid" handleChanged={false} loading={false} discoverable={null} birthYearOptions={[]} birthMonthOptions={[]} countryOptions={[]} timezoneOptions={[]} onNext={() => {}} />);
    expect(screen.getByText("Handle Error")).toBeInTheDocument();
  });


  it("ProfileAvailabilitySection shows errors", () => {
    const methods = { control: {}, register: () => {}, setValue: () => {} };
    render(<ProfileAvailabilitySection t={t} control={methods.control as any} register={methods.register as any} setValue={methods.setValue as any} errors={{}} availabilityErrorMessage="Availability Error" availabilityFields={[]} availability={[]} timezoneOptions={[]} weekdays={[]} onAddAvailability={() => {}} onRemoveAvailability={() => {}} />);
    expect(screen.getByText("Availability Error")).toBeInTheDocument();
  });

  it("ProfileAvailabilitySection interaction", async () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const user = userEvent.setup();

    const TestComponent = () => {
      const methods = useForm<ProfileFormValues>({
        defaultValues: {
          handle: "testuser",
          birthYear: "",
          birthMonth: "",
          countryCode: "",
          timezone: "",
          languages: [],
          availability: [
            { weekdays: [1], start_local_time: "09:00", end_local_time: "17:00", timezone: "UTC" }
          ],
        },
      });
      return (
        <ProfileAvailabilitySection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          availabilityFields={[{ id: "1" }]}
          availability={methods.getValues("availability")}
          timezoneOptions={[{ value: "UTC", label: "UTC" }]}
          weekdays={["Sun", "Mon"]}
          onAddAvailability={onAdd}
          onRemoveAvailability={onRemove}
        />
      );
    };

    render(<TestComponent />);

    await user.click(screen.getByText("addAvailability"));
    expect(onAdd).toHaveBeenCalled();
    
    await user.click(screen.getByText("removeButton"));
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});
