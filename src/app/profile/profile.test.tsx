import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./page";

const getJson = vi.fn();
const putJson = vi.fn();
const getAccessToken = vi.fn();
const getUserId = vi.fn();

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
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(await screen.findByText(/handle is required/i)).toBeInTheDocument();
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
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
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
    await vi.advanceTimersByTimeAsync(600);

    expect(await screen.findByText(/handle is available/i)).toBeInTheDocument();
    vi.useRealTimers();
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

    await user.click(screen.getByRole("button", { name: /add language/i }));
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[1], "5");
    await user.click(screen.getAllByLabelText(/target/i)[1]);

    await user.click(screen.getByRole("button", { name: /add availability slot/i }));
    const timeInputs = document.querySelectorAll('input[type="time"]') as NodeListOf<HTMLInputElement>;
    await user.clear(timeInputs[0]);
    await user.type(timeInputs[0], "19:00");
    await user.clear(timeInputs[1]);
    await user.type(timeInputs[1], "21:00");
  });

});
