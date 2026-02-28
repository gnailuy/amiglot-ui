import { describe, expect, it, vi } from "vitest";

import {
  getLocaleCookieValue,
  getPreferredLocale,
  isTranslatedLocale,
  normalizeLocale,
  resolveMessageLocale,
  setLocaleCookie,
} from "@/i18n/locale";


describe("i18n locale helpers", () => {
  it("normalizes locale strings", () => {
    expect(normalizeLocale("pt_BR")).toBe("pt-BR");
    expect(normalizeLocale("en")).toBe("en");
  });

  it("resolves message locales", () => {
    expect(resolveMessageLocale("zh-CN")).toBe("zh");
    expect(resolveMessageLocale("zh-Hant")).toBe("zh");
    expect(resolveMessageLocale("pt-BR")).toBe("pt-BR");
    expect(resolveMessageLocale("pt_BR")).toBe("pt-BR");
    expect(resolveMessageLocale("pt-PT")).toBe("pt-BR");
    expect(resolveMessageLocale("pt")).toBe("pt-BR");
    expect(resolveMessageLocale("en-US")).toBe("en");
    expect(resolveMessageLocale("fr-FR")).toBe("en");
  });

  it("checks translated locales", () => {
    expect(isTranslatedLocale("zh-Hans")).toBe(true);
    expect(isTranslatedLocale("zh-Hant")).toBe(true);
    expect(isTranslatedLocale("pt-BR")).toBe(true);
    expect(isTranslatedLocale("pt-PT")).toBe(true);
    expect(isTranslatedLocale("en-GB")).toBe(true);
    expect(isTranslatedLocale("fr-FR")).toBe(true);
  });

  it("handles cookie-based locale preferences", () => {
    document.cookie = "NEXT_LOCALE=zh; path=/";
    expect(getLocaleCookieValue()).toBe("zh");
    expect(getPreferredLocale("en")).toBe("zh");

    setLocaleCookie("pt-BR");
    expect(document.cookie).toContain("NEXT_LOCALE=pt-BR");
    expect(getPreferredLocale("en")).toBe("pt-BR");
  });

  it("returns null without document", () => {
    vi.stubGlobal("document", undefined);
    expect(getLocaleCookieValue()).toBeNull();
    expect(() => setLocaleCookie("en")).not.toThrow();
    vi.unstubAllGlobals();
  });
});
