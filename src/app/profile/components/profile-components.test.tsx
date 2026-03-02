import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import React from "react";

import ProfileAvailabilitySection from "./profile-availability-section";
import ProfileDetailsSection from "./profile-details-section";
import ProfileLanguageSection from "./profile-language-section";

describe("Profile Components Coverage", () => {
  const t = (k: string) => k;

  it("ProfileDetailsSection interaction", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup();

    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          handle: "testuser",
          birthYear: "",
          birthMonth: "",
          countryCode: "",
          timezone: "",
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
          loading={false}
          discoverable={true}
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

  it("ProfileLanguageSection interaction", async () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onNext = vi.fn();
    const user = userEvent.setup();

    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          languages: [
            { language_code: "en", level: 5, is_target: false, description: "" }
          ]
        }
      });
      return (
        <ProfileLanguageSection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          errors={{}}
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

  it("ProfileAvailabilitySection interaction", async () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const user = userEvent.setup();

    const TestComponent = () => {
      const methods = useForm({
        defaultValues: {
          availability: [
            { weekdays: [1], start_local_time: "09:00", end_local_time: "17:00", timezone: "UTC" }
          ]
        }
      });
      return (
        <ProfileAvailabilitySection
          t={t}
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          errors={{}}
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
