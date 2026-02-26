import { describe, expect, it, vi } from "vitest";

import { ApiError, getJson, postJson, putJson } from "./api";

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

  it("uses session token and locale when available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { language: "fr-CA" });
    vi.stubGlobal("crypto", undefined as unknown as Crypto);
    window.localStorage.setItem("amiglot_access_token", "token-xyz");

    await getJson("/profile");

    const [, options] = fetchMock.mock.calls[0];
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer token-xyz",
      "Accept-Language": "fr-CA",
    });
    expect(options?.headers?.["X-Request-Id"]).toBeUndefined();
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

  it("handles error messages from detail and message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: "Nope" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getJson("/oops")).rejects.toThrow("Nope");
  });

  it("falls back to top-level message when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Something went wrong" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getJson("/oops")).rejects.toThrow("Something went wrong");
  });

  it("uses default message when response has no error shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getJson("/oops")).rejects.toThrow("Request failed (503)");
  });

  it("supports postJson and putJson", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await postJson("/submit", { ok: true });
    await putJson("/update", { name: "Arturo" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/submit"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/update"),
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
