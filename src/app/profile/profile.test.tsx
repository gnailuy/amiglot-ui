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
    expect(screen.getByPlaceholderText("en")).toHaveValue("en");
    expect(screen.getByPlaceholderText(/defaults to/i)).toHaveValue("");
  });

  it("validates required fields on save", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
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
          level: 0,
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
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(await screen.findByText(/handle is required/i)).toBeInTheDocument();
    expect(putJson).not.toHaveBeenCalled();
  });

  it("submits profile updates", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson
      .mockResolvedValueOnce({
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
});

  it("ignores 404 errors on load", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    const ApiError = (await import("@/lib/api")).ApiError;
    getJson.mockRejectedValueOnce(new ApiError("not found", 404));

    render(<ProfilePage />);

    await screen.findByText(/profile setup/i);
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument();
  });

  it("shows error when profile load fails", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockRejectedValueOnce(new Error("boom"));

    render(<ProfilePage />);

    expect(await screen.findByText(/boom/)).toBeInTheDocument();
  });

  it("validates timezone and language rules", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
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
          level: 0,
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

    await userEvent.clear(screen.getByLabelText(/timezone/i));
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));
    expect(await screen.findByText(/timezone is required/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/timezone/i), "UTC");
    await userEvent.clear(screen.getByPlaceholderText("en"));
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));
    expect(
      await screen.findByText(/fill every language code/i),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("en"), "en");
    await userEvent.click(screen.getByLabelText(/native/i));
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));
    expect(
      await screen.findByText(/native language is required/i),
    ).toBeInTheDocument();
  });

  it("shows error when save fails", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
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
          level: 0,
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

  it("adds and removes languages and availability", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
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
          level: 0,
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

    await userEvent.click(screen.getByRole("button", { name: /add language/i }));
    expect(screen.getAllByPlaceholderText("en").length).toBe(2);

    await userEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(screen.getAllByPlaceholderText("en").length).toBe(1);

    await userEvent.click(
      screen.getByRole("button", { name: /add availability slot/i }),
    );
    expect(screen.getAllByPlaceholderText(/defaults to/i).length).toBe(2);
  });

  it("shows fallback message when load fails with non-error", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockRejectedValueOnce("nope");

    render(<ProfilePage />);

    expect(
      await screen.findByText(/could not load your profile yet/i),
    ).toBeInTheDocument();
  });

  it("shows fallback message when save fails with non-error", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
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
          level: 0,
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
    putJson.mockRejectedValueOnce("nope");

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));
    expect(
      await screen.findByText(/could not save profile/i),
    ).toBeInTheDocument();
  });

  it("keeps at least one language and availability", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
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
          level: 0,
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

    await userEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(screen.getAllByPlaceholderText("en").length).toBe(1);

    await userEvent.click(screen.getAllByRole("button", { name: /remove/i })[1]);
    expect(screen.getAllByPlaceholderText(/defaults to/i).length).toBe(1);
  });

  it("updates inputs for profile, languages, and availability", async () => {
    getAccessToken.mockReturnValue("token");
    getUserId.mockReturnValue("user-1");
    getJson.mockResolvedValueOnce({
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
          level: 0,
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
    });

    render(<ProfilePage />);
    await screen.findByText(/profile setup/i);

    await userEvent.clear(screen.getByPlaceholderText("arturo"));
    await userEvent.type(screen.getByPlaceholderText("arturo"), "neo");
    expect(screen.getByPlaceholderText("arturo")).toHaveValue("neo");

    await userEvent.type(screen.getByPlaceholderText("1992"), "1992");
    await userEvent.type(screen.getByPlaceholderText("8"), "8");
    await userEvent.type(screen.getByPlaceholderText("CA"), "US");

    const languageInput = screen.getByPlaceholderText("en");
    await userEvent.clear(languageInput);
    await userEvent.type(languageInput, "es");
    expect(languageInput).toHaveValue("es");

    const selects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(selects[0], "3");
    await userEvent.click(screen.getByLabelText(/target/i));

    const descriptionInput = screen.getByPlaceholderText(/short description/i);
    await userEvent.type(descriptionInput, "testing");
    expect(descriptionInput).toHaveValue("testing");

    await userEvent.selectOptions(selects[1], "2");
    const timeInputs = document.querySelectorAll(
      'input[type="time"]',
    ) as NodeListOf<HTMLInputElement>;
    await userEvent.clear(timeInputs[0]);
    await userEvent.type(timeInputs[0], "19:00");
    await userEvent.clear(timeInputs[1]);
    await userEvent.type(timeInputs[1], "21:00");
    await userEvent.type(screen.getByPlaceholderText(/defaults to/i), "UTC");
  });
