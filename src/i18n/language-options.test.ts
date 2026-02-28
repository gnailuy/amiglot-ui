import { describe, expect, it } from "vitest";

import { buildLanguageSelectOptions } from "@/i18n/language-options";

describe("buildLanguageSelectOptions", () => {
  it("filters entries without proper display names", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      of(value: string) {
        if (value === "pt-BR") {
          return "Portuguese";
        }
        if (value === "aa") {
          return "aa";
        }
        return undefined;
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["pt-BR", "aa"], "en");
    expect(options).toEqual([
      { value: "pt-BR", label: "Portuguese (pt-BR)" },
    ]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("falls back when Intl.DisplayNames is unavailable", () => {
    const original = Intl.DisplayNames;

    Object.defineProperty(Intl, "DisplayNames", {
      value: undefined,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["en"], "en");
    expect(options).toEqual([{ value: "en", label: "en (en)" }]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("handles display name fallbacks for underscored locales", () => {
    const original = Intl.DisplayNames;
    let firstCall = true;
    class MockDisplayNames {
      of(value: string) {
        if (value === "pt-BR" && firstCall) {
          firstCall = false;
          throw new Error("bad locale");
        }
        if (value === "pt-BR") {
          return "Portuguese";
        }
        throw new Error("bad locale");
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["pt_BR"], "en");
    expect(options).toEqual([
      { value: "pt-BR", label: "Portuguese (pt-BR)" },
    ]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });
});
