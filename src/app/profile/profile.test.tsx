import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./page";

vi.mock("@/components/ui/select", () => {
  const SelectContext = React.createContext<{
    setTriggerProps: (props: Record<string, unknown>) => void;
  } | null>(null);

  type SelectProps = {
    value?: string;
    onValueChange?: (value: string) => void;
    children?: React.ReactNode;
  };

  const Select = ({ value, onValueChange, children }: SelectProps) => {
    const [triggerProps, setTriggerProps] = React.useState<Record<string, unknown>>({});
    return (
      <SelectContext.Provider value={{ setTriggerProps }}>
        <select
          value={value}
          onChange={(event) => onValueChange?.(event.target.value)}
          {...triggerProps}
        >
          {children}
        </select>
      </SelectContext.Provider>
    );
  };

  type SelectTriggerProps = Record<string, unknown>;

  const SelectTrigger = (props: SelectTriggerProps) => {
    const ctx = React.useContext(SelectContext);
    React.useEffect(() => {
      ctx?.setTriggerProps(props);
    }, [ctx, props]);
    return null;
  };

  const SelectValue = () => null;
  const SelectContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  const SelectItem = ({ value, children }: { value: string; children?: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

const getJson = vi.fn();
const putJson = vi.fn();
const getAccessToken = vi.fn();
const getUserId = vi.fn();

const selectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionText: string,
) => {
  const option = await within(trigger).findByRole("option", { name: optionText });
  fireEvent.change(trigger, { target: { value: option.getAttribute("value") ?? "" } });
  await waitFor(() => expect(option.selected).toBe(true));
};

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  getJson: (...args: unknown[]) => getJson(...args),
  putJson: (...args: unknown[]) => putJson(...args),
}));

vi.mock("@/lib/session", () => ({
  getAccessToken: () => getAccessToken(),
  getUserId: () => getUserId(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    getJson.mockReset();
    putJson.mockReset();
    getAccessToken.mockReset();
    getUserId.mockReset();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  it("asks user to sign in when missing session", () => {
    getAccessToken.mockReturnValue(null);
    getUserId.mockReturnValue(null);

    render(<ProfilePage />);

    expect(screen.getByText(/need to sign in/i)).toBeInTheDocument();
  });

  it("shows loading state while profile is loading", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockReturnValue(new Promise(() => {}));

    render(<ProfilePage />);

    expect(await screen.findByText(/loading your profile/i)).toBeInTheDocument();
  });

  it("defaults to empty language and availability states", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
      profile: {
        handle: "",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [],
      availability: [],
    });

    render(<ProfilePage />);

    expect(await screen.findByText(/profile setup/i)).toBeInTheDocument();
    expect(await screen.findByDisplayValue("user@example.com")).toBeInTheDocument();
  });

  it("validates required fields on save", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
      profile: {
        handle: "",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: "",
        },
      ],
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });

    render(<ProfilePage />);

    await screen.findByText(/profile setup/i);
    await userEvent.clear(screen.getByPlaceholderText("arturo"));

    expect(await screen.findByText(/handle is required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save profile/i })).toBeDisabled();
    expect(putJson).not.toHaveBeenCalled();
  });

  it("submits profile updates", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson
      .mockResolvedValueOnce({
        user: { id: "user-1", email: "user@example.com" },
        profile: {
          handle: "arturo",
          birth_year: null,
          birth_month: null,
          country_code: null,
          timezone: "America/Vancouver",
          discoverable: false,
        },
        languages: [
          {
            language_code: "en",
            level: 5,
            is_native: true,
            is_target: false,
            description: "",
          },
        ],
        availability: [
          {
            weekday: 1,
            start_local_time: "18:00",
            end_local_time: "20:00",
            timezone: "",
          },
        ],
      })
      .mockResolvedValueOnce({
        user: { id: "user-1", email: "user@example.com" },
        profile: {
          handle: "arturo",
          birth_year: null,
          birth_month: null,
          country_code: null,
          timezone: "America/Vancouver",
          discoverable: true,
        },
        languages: [
          {
            language_code: "en",
            level: 5,
            is_native: true,
            is_target: false,
            description: "",
          },
        ],
        availability: [
          {
            weekday: 1,
            start_local_time: "18:00",
            end_local_time: "20:00",
            timezone: "America/Vancouver",
          },
        ],
      });
    putJson.mockResolvedValue({});

    render(<ProfilePage />);

    await screen.findByText(/profile setup/i);
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(putJson).toHaveBeenCalledWith("/profile", {
      handle: "arturo",
      birth_year: null,
      birth_month: null,
      country_code: null,
      timezone: "America/Vancouver",
    });
    expect(putJson).toHaveBeenCalledWith("/profile/languages", {
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: null,
        },
      ],
    });
    expect(putJson).toHaveBeenCalledWith("/profile/availability", {
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });
    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
  });

  it("submits profile updates with birth info", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson
      .mockResolvedValueOnce({
        user: { id: "user-1", email: "user@example.com" },
        profile: {
          handle: "arturo",
          birth_year: null,
          birth_month: null,
          country_code: null,
          timezone: "America/Vancouver",
          discoverable: false,
        },
        languages: [
          {
            language_code: "en",
            level: 5,
            is_native: true,
            is_target: false,
            description: "",
          },
        ],
        availability: [
          {
            weekday: 1,
            start_local_time: "18:00",
            end_local_time: "20:00",
            timezone: "America/Vancouver",
          },
        ],
      })
      .mockResolvedValueOnce({ available: true })
      .mockResolvedValueOnce({
        user: { id: "user-1", email: "user@example.com" },
        profile: {
          handle: "arturo",
          birth_year: 2000,
          birth_month: 1,
          country_code: null,
          timezone: "America/Vancouver",
          discoverable: true,
        },
        languages: [
          {
            language_code: "en",
            level: 5,
            is_native: true,
            is_target: false,
            description: "",
          },
        ],
        availability: [
          {
            weekday: 1,
            start_local_time: "18:00",
            end_local_time: "20:00",
            timezone: "America/Vancouver",
          },
        ],
      });
    putJson.mockResolvedValue({});

    render(<ProfilePage />);

    await screen.findByDisplayValue("user@example.com");
    await waitFor(() =>
      expect(screen.queryByText(/loading your profile/i)).not.toBeInTheDocument(),
    );

    await selectOption(user, screen.getByLabelText(/birth year/i), "2000");
    await selectOption(user, screen.getByLabelText(/birth month/i), "January");

    const saveButton = screen.getByRole("button", { name: /save profile/i });
    await waitFor(() => expect(saveButton).toBeEnabled());
    await userEvent.click(saveButton);

    expect(putJson).toHaveBeenCalledWith("/profile", {
      handle: "arturo",
      birth_year: 2000,
      birth_month: 1,
      country_code: null,
      timezone: "America/Vancouver",
    });
    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
  });

  it("shows error when save fails", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
      profile: {
        handle: "arturo",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: "",
        },
      ],
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });
    putJson.mockRejectedValueOnce(new Error("save boom"));

    render(<ProfilePage />);

    await screen.findByText(/profile setup/i);
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(await screen.findByText(/save boom/i)).toBeInTheDocument();
  });

  it("shows handle availability status", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson
      .mockResolvedValueOnce({
        user: { id: "user-1", email: "user@example.com" },
        profile: {
          handle: "arturo",
          birth_year: null,
          birth_month: null,
          country_code: null,
          timezone: "America/Vancouver",
          discoverable: false,
        },
        languages: [
          {
            language_code: "en",
            level: 5,
            is_native: true,
            is_target: false,
            description: "",
          },
        ],
        availability: [
          {
            weekday: 1,
            start_local_time: "18:00",
            end_local_time: "20:00",
            timezone: "America/Vancouver",
          },
        ],
      })
      .mockResolvedValueOnce({ available: true });

    render(<ProfilePage />);

    await screen.findByText(/profile setup/i);
    const handleInput = screen.getByPlaceholderText("arturo");
    await user.clear(handleInput);
    await user.type(handleInput, "neo");
    await new Promise((resolve) => setTimeout(resolve, 650));

    expect(await screen.findByText(/handle is available/i)).toBeInTheDocument();
  });

  it("updates language and availability inputs", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
      profile: {
        handle: "arturo",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: "",
        },
      ],
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);

    await user.click(screen.getByRole("tab", { name: /language/i }));
    await user.click(screen.getByRole("button", { name: /add language/i }));

    await user.click(screen.getByRole("tab", { name: /availability/i }));
    await user.click(screen.getByRole("button", { name: /add availability slot/i }));
    const timeInputs = document.querySelectorAll('input[type="time"]') as NodeListOf<HTMLInputElement>;
    await user.clear(timeInputs[0]);
    await user.type(timeInputs[0], "19:00");
    await user.clear(timeInputs[1]);
    await user.type(timeInputs[1], "21:00");
  });


  it("shows profile load error message", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockRejectedValueOnce(new Error("boom"));

    render(<ProfilePage />);

    expect(await screen.findByText(/boom/)).toBeInTheDocument();
  });

  it("handles 404 profile load without error", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    const ApiError = (await import("@/lib/api")).ApiError;
    getJson.mockRejectedValueOnce(new ApiError("not found", 404));

    render(<ProfilePage />);

    await screen.findByText(/profile setup/i);
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument();
  });

  it("flags timezone as required", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
      profile: {
        handle: "arturo",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: "",
        },
      ],
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);

    await selectOption(user, screen.getByLabelText(/timezone/i), "Select timezone");

    expect(await screen.findByText(/timezone is required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save profile/i })).toBeDisabled();
  });

  it("rejects invalid handle characters on save", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
      profile: {
        handle: "arturo",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: "",
        },
      ],
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);

    const handleInput = screen.getByPlaceholderText("arturo");
    await user.clear(handleInput);
    await user.type(handleInput, "neo!");

    expect(await screen.findByText(/handle can only use letters and numbers/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save profile/i })).toBeDisabled();
    expect(putJson).not.toHaveBeenCalled();
  });

  it("requires at least one native language", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
      profile: {
        handle: "arturo",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: "",
        },
      ],
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);

    await user.click(screen.getByRole("tab", { name: /language/i }));

    const languageSection = screen
      .getByRole("heading", { name: /languages/i })
      .closest("section");
    const levelSelect = within(languageSection as HTMLElement).getAllByLabelText(/language level/i)[0];
    await selectOption(user, levelSelect, "Advanced");

    expect(await screen.findByText(/at least one native language is required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save profile/i })).toBeDisabled();
    expect(putJson).not.toHaveBeenCalled();
  });

  it("shows invalid handle helper text", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
      user: { id: "user-1", email: "user@example.com" },
      profile: {
        handle: "arturo",
        birth_year: null,
        birth_month: null,
        country_code: null,
        timezone: "America/Vancouver",
        discoverable: false,
      },
      languages: [
        {
          language_code: "en",
          level: 5,
          is_native: true,
          is_target: false,
          description: "",
        },
      ],
      availability: [
        {
          weekday: 1,
          start_local_time: "18:00",
          end_local_time: "20:00",
          timezone: "America/Vancouver",
        },
      ],
    });

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);

    const handleInput = screen.getByPlaceholderText("arturo");
    await user.clear(handleInput);
    await user.type(handleInput, "ab");

    expect(await screen.findByText(/handle must be 3–20/i)).toBeInTheDocument();
  });

  it("shows handle unavailable status", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson
      .mockResolvedValueOnce({
        user: { id: "user-1", email: "user@example.com" },
        profile: {
          handle: "arturo",
          birth_year: null,
          birth_month: null,
          country_code: null,
          timezone: "America/Vancouver",
          discoverable: false,
        },
        languages: [
          {
            language_code: "en",
            level: 5,
            is_native: true,
            is_target: false,
            description: "",
          },
        ],
        availability: [
          {
            weekday: 1,
            start_local_time: "18:00",
            end_local_time: "20:00",
            timezone: "America/Vancouver",
          },
        ],
      })
      .mockResolvedValueOnce({ available: false });

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);

    const handleInput = screen.getByPlaceholderText("arturo");
    await user.clear(handleInput);
    await user.type(handleInput, "nova");
    await new Promise((resolve) => setTimeout(resolve, 650));

    expect(await screen.findByText(/handle is taken/i)).toBeInTheDocument();
  });

});
