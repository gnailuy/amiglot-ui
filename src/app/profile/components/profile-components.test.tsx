import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
          handleChanged
          // loading removed
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

  it("ProfileDetailsSection shows error states", () => {
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
          errors={{ handle: { message: "Handle Error", type: "custom" } } as any}
          email=""
          effectiveHandleAvailability="invalid"
          handleChanged
          birthYearOptions={[]}
          birthMonthOptions={[]}
          countryOptions={[]}
          timezoneOptions={[]}
          onNext={() => {}}
        />
      );
    };

    render(<TestComponent />);
    expect(screen.getByText("Handle Error")).toBeInTheDocument();
  });

  it("ProfileDetailsSection shows handle status states", () => {
    const baseDefaults = {
      handle: "testuser",
      birthYear: "",
      birthMonth: "",
      countryCode: "",
      timezone: "",
      languages: [],
      availability: [],
    };

    const renderWithAvailability = (availability: "checking" | "unavailable" | "invalid") => {
      const TestComponent = () => {
        const methods = useForm<ProfileFormValues>({
          defaultValues: baseDefaults,
        });

        return (
          <ProfileDetailsSection
            t={t}
            control={methods.control}
            register={methods.register}
            errors={{}}
            email="test@example.com"
            effectiveHandleAvailability={availability}
            handleChanged
            birthYearOptions={[]}
            birthMonthOptions={[]}
            countryOptions={[]}
            timezoneOptions={[]}
            onNext={() => {}}
          />
        );
      };

      render(<TestComponent />);
    };

    renderWithAvailability("checking");
    expect(screen.getByText("handleAvailabilityChecking")).toBeInTheDocument();

    renderWithAvailability("unavailable");
    expect(screen.getByText("handleAvailabilityUnavailable")).toBeInTheDocument();

    renderWithAvailability("invalid");
    expect(screen.getByText("handleInvalidLengthHelper")).toBeInTheDocument();
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
          // errors removed
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

  it("ProfileLanguageSection shows errors", () => {
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
        <ProfileLanguageSection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          languageErrorMessage="Language Error"
          languageOptions={[]}
          proficiencyLabels={{}}
          languageFields={[]}
          languages={[]}
          onAddLanguage={() => {}}
          onRemoveLanguage={() => {}}
          onNext={() => {}}
        />
      );
    };
    render(<TestComponent />);
    expect(screen.getByText("Language Error")).toBeInTheDocument();
  });


  it("ProfileLanguageSection toggles target language and adjusts level", async () => {
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
            { language_code: "en", level: 5, is_target: false, description: "" },
          ],
          availability: [],
        },
      });
      // eslint-disable-next-line react-hooks/incompatible-library
      const languageValues = methods.watch("languages");
      return (
        <ProfileLanguageSection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          languageOptions={[{ value: "en", label: "English" }]}
          proficiencyLabels={{ 4: "Advanced", 5: "Native" }}
          languageFields={[{ id: "1" }]}
          languages={languageValues}
          onAddLanguage={() => {}}
          onRemoveLanguage={() => {}}
          onNext={() => {}}
        />
      );
    };

    render(<TestComponent />);
    const selectTrigger = screen.getByLabelText("Language level");
    expect(selectTrigger).toHaveTextContent("Native");

    const checkbox = screen.getByLabelText("targetLanguage") as HTMLInputElement;
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(selectTrigger).toHaveTextContent("Advanced");
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
          // errors removed
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

  it("ProfileAvailabilitySection shows errors", () => {
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
        <ProfileAvailabilitySection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          availabilityErrorMessage="Availability Error"
          availabilityFields={[]}
          availability={[]}
          timezoneOptions={[]}
          weekdays={[]}
          onAddAvailability={() => {}}
          onRemoveAvailability={() => {}}
        />
      );
    };
    render(<TestComponent />);
    expect(screen.getByText("Availability Error")).toBeInTheDocument();
  });


  it("ProfileAvailabilitySection updates weekdays", async () => {
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
            { weekdays: [1], start_local_time: "09:00", end_local_time: "17:00", timezone: "UTC" },
          ],
        },
      });
      // eslint-disable-next-line react-hooks/incompatible-library
      const availabilityValues = methods.watch("availability");
      return (
        <ProfileAvailabilitySection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          availabilityFields={[{ id: "1" }]}
          availability={availabilityValues}
          timezoneOptions={[{ value: "UTC", label: "UTC" }]}
          weekdays={["Sun", "Mon"]}
          onAddAvailability={() => {}}
          onRemoveAvailability={() => {}}
        />
      );
    };

    render(<TestComponent />);
    const sunToggle = screen.getByLabelText("Sun");
    expect(sunToggle).toHaveAttribute("aria-pressed", "false");

    await user.click(sunToggle);
    expect(sunToggle).toHaveAttribute("aria-pressed", "true");
  });
});
