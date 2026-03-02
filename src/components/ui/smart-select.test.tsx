import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SmartSelect } from "./smart-select";

describe("SmartSelect", () => {
  it("renders simple select for short lists", async () => {
    const onChange = vi.fn();
    render(
      <SmartSelect
        value="a"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        onValueChange={onChange}
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders searchable select for long lists", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const options = Array.from({ length: 15 }, (_, i) => ({
      value: String(i),
      label: String(i),
    }));
    render(
      <SmartSelect
        value="1"
        options={options}
        onValueChange={onChange}
        longListThreshold={10}
      />
    );
    // Searchable uses Popover + Command
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    
    // Open it
    await user.click(trigger);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("renders searchable select if empty option exists", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SmartSelect
        value=""
        options={[
          { value: "", label: "None" },
          { value: "a", label: "A" },
        ]}
        onValueChange={onChange}
      />
    );
    // Should be searchable because of empty value workaround
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });
});
