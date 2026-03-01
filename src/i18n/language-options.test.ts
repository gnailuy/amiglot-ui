import { describe, expect, it } from "vitest";

import {
  buildLanguageSelectOptions,
  buildLanguageSwitcherOptions,
} from "@/i18n/language-options";

describe("buildLanguageSelectOptions", () => {
  it("groups entries with display names first", () => {
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
      { value: "aa", label: "Afar (aa)" },
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

  it("filters out the root locale (und)", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      of(value: string) {
        if (value === "und") {
          return "root";
        }
        if (value === "en") {
          return "English";
        }
        return value;
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(["und", "en"], "en");
    expect(options).toEqual([{ value: "en", label: "English (en)" }]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("filters out non-language placeholders", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      of(value: string) {
        return value;
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSelectOptions(
      ["und", "zxx", "mis", "mul", "root", "qaa", "qtz", "art", "cel", "phi", "tut", "sgn", "en"],
      "en",
    );
    expect(options).toEqual([{ value: "en", label: "English (en)" }]);

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
    expect(options).toEqual([{ value: "en", label: "English (en)" }]);

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

  it("keeps entries when display names cannot be resolved", () => {
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
    expect(options).toEqual([
      { value: "pt-BR", label: "Brazilian Portuguese (pt-BR)" },
    ]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("keeps entries where label matches code (redundant display)", () => {
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
    expect(options).toEqual([{ value: "en", label: "English (en)" }]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("keeps entries where label matches lowercased code", () => {
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
    expect(options).toEqual([{ value: "EN", label: "EN (EN)" }]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });
});

describe("buildLanguageSwitcherOptions", () => {
  it("uses english fallbacks for switcher labels", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      private locale: string;
      constructor(locales: string[]) {
        this.locale = locales[0];
      }
      of(value: string) {
        if (this.locale === "es" && value === "es") {
          return "Español";
        }
        if (this.locale === "de" && value === "de") {
          return "Deutsch";
        }
        return value;
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSwitcherOptions(["es", "de"]);
    expect(options).toEqual([
      { value: "de", label: "German (de)" },
      { value: "es", label: "Spanish (es)" },
    ]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });
  it("filters out non-language placeholders for switcher", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      private locale: string;
      constructor(locales: string[]) {
        this.locale = locales[0];
      }
      of(value: string) {
        if (value === "en") {
          return "English";
        }
        return value;
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSwitcherOptions(["und", "qaa", "en"]);
    expect(options).toEqual([{ value: "en", label: "English (en)" }]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });

  it("limits the switcher to ISO 639-1 languages", () => {
    const original = Intl.DisplayNames;
    class MockDisplayNames {
      private locale: string;
      constructor(locales: string[]) {
        this.locale = locales[0];
      }
      of(value: string) {
        if (value === "es") {
          return "Español";
        }
        if (value === "es-419") {
          return "Español (Latinoamérica)";
        }
        if (value === "pt") {
          return "Português";
        }
        if (value === "pt-BR") {
          return "Português (Brasil)";
        }
        return value;
      }
    }

    Object.defineProperty(Intl, "DisplayNames", {
      value: MockDisplayNames,
      configurable: true,
    });

    const options = buildLanguageSwitcherOptions(["pt-BR", "pt", "es-419", "es", "ace"]);
    expect(options).toEqual([
      { value: "es", label: "Spanish (es)" },
      { value: "es-419", label: "Latin American Spanish (es-419)" },
      { value: "pt", label: "Portuguese (pt)" },
      { value: "pt-BR", label: "Brazilian Portuguese (pt-BR)" },
    ]);

    Object.defineProperty(Intl, "DisplayNames", {
      value: original,
      configurable: true,
    });
  });
});

