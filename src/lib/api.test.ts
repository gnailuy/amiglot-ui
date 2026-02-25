import { describe, expect, it, vi } from "vitest";

import { ApiError, getJson } from "./api";

describe("api helpers", () => {
  it("includes auth and request headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid" });

    await getJson("/healthz", { token: "token-123" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer token-123",
      "X-Request-Id": "test-uuid",
      "Content-Type": "application/json",
    });
  });

  it("throws ApiError when response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Bad request" } }),
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid" });

    await expect(getJson("/broken")).rejects.toBeInstanceOf(ApiError);
  });

  it("uses fallback locale and user headers when set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid" });
    vi.stubGlobal("navigator", { language: "" });
    window.localStorage.setItem("amiglot_user_id", "user-456");

    await getJson("/profile");

    const [, options] = fetchMock.mock.calls[0];
    expect(options?.headers).toMatchObject({
      "Accept-Language": "en",
      "X-User-Id": "user-456",
    });
  });
});
