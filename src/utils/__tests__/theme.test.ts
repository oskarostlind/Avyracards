import { describe, expect, it } from "vitest";

import { getTheme, themes } from "@/utils/theme";

describe("getTheme", () => {
  it("returns default tokens when theme name is unknown", () => {
    expect(getTheme("unknown")).toEqual(themes.default);
  });

  it("returns requested theme tokens", () => {
    expect(getTheme("dark")).toEqual(themes.dark);
  });
});
