import { describe, expect, it } from "vitest";

import {
  clearAccessToken,
  clearUserId,
  getAccessToken,
  getUserId,
  setAccessToken,
  setUserId,
} from "./session";

describe("session helpers", () => {
  it("stores and clears access token", () => {
    expect(getAccessToken()).toBeNull();

    setAccessToken("token-123");
    expect(getAccessToken()).toBe("token-123");

    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("stores and clears user id", () => {
    expect(getUserId()).toBeNull();

    setUserId("user-456");
    expect(getUserId()).toBe("user-456");

    clearUserId();
    expect(getUserId()).toBeNull();
  });
});

  it("handles missing window", () => {
    const originalWindow = (globalThis as any).window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = undefined;

    expect(getAccessToken()).toBeNull();
    expect(getUserId()).toBeNull();

    setAccessToken("token");
    setUserId("user");
    clearAccessToken();
    clearUserId();

    (globalThis as any).window = originalWindow;
  });
