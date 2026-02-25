import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VerifyPage from "./page";

const postJson = vi.fn();
const setAccessToken = vi.fn();
const setUserId = vi.fn();
const useSearchParams = vi.fn();

vi.mock("@/lib/api", () => ({
  postJson: (...args: unknown[]) => postJson(...args),
}));

vi.mock("@/lib/session", () => ({
  setAccessToken: (...args: unknown[]) => setAccessToken(...args),
  setUserId: (...args: unknown[]) => setUserId(...args),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("VerifyPage", () => {
  beforeEach(() => {
    postJson.mockReset();
    setAccessToken.mockReset();
    setUserId.mockReset();
    useSearchParams.mockReset();
  });

  it("shows missing token message when no token provided", () => {
    useSearchParams.mockReturnValue({ get: () => null });

    render(<VerifyPage />);

    expect(screen.getByText(/missing token/i)).toBeInTheDocument();
    expect(postJson).not.toHaveBeenCalled();
  });

  it("verifies token and stores session", async () => {
    useSearchParams.mockReturnValue({ get: () => "token-123" });
    postJson.mockResolvedValue({
      access_token: "access-456",
      user: { id: "user-1", email: "user@test.com" },
    });

    render(<VerifyPage />);

    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
    expect(setAccessToken).toHaveBeenCalledWith("access-456");
    expect(setUserId).toHaveBeenCalledWith("user-1");
  });
});
