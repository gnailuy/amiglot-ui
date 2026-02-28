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

  it("skips duplicate normalized values", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      of(value: string) {
        return value === "pt-BR" ? "Portuguese" : "English";
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["pt_BR", "pt-BR"], "en");
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
    const hadOwn = Object.prototype.hasOwnProperty.call(Intl, "DisplayNames");

    // Ensure the DisplayNames property is missing to hit the early return branch.
    try {
      delete (Intl as { DisplayNames?: unknown }).DisplayNames;
    } catch {
      Object.defineProperty(Intl, "DisplayNames", {
        value: undefined,
        configurable: true,
      });
    }

    const options = buildLanguageSelectOptions(["en"], "en");
    expect(options).toEqual([{ value: "en", label: "en (en)" }]);

    if (hadOwn) {
      Object.defineProperty(Intl, "DisplayNames", {
        value: original,
        configurable: true,
      });
    }
  });

  it("handles display name fallbacks for underscored locales", () => {
    const original = Intl.DisplayNames;
    let firstCall = true;
    class MockDisplayNames {
      of(value: string) {
        // Simulate failure on first try (normalized code) to force fallback
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

  it("drops entries when display names cannot be resolved", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      of() {
        throw new Error("bad locale");
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["pt-BR"], "en");
    expect(options).toEqual([]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("filters out entries where label matches code (redundant display)", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      of(value: string) {
        // Return same as code to trigger filtering
        return value;
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["en"], "en");
    expect(options).toEqual([]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("filters out entries where label matches lowercased code", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      of(value: string) {
        return value.toLowerCase();
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["EN"], "en");
    expect(options).toEqual([]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });
});
