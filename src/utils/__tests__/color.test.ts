import { describe, expect, it } from "vitest";

import {
  getReadableTextColor,
  hexToRgba,
  isValidHexColor,
  normalizeHexColor,
} from "@/utils/color";

describe("isValidHexColor", () => {
  it("accepterar 3- och 6-siffriga hexvärden", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#FFFFFF")).toBe(true);
    expect(isValidHexColor(" #8b5cf6 ")).toBe(true);
  });

  it("avvisar allt annat", () => {
    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("#12345")).toBe(false);
    expect(isValidHexColor("#ffffffff")).toBe(false);
    expect(isValidHexColor("rgb(0,0,0)")).toBe(false);
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(123)).toBe(false);
  });
});

describe("normalizeHexColor", () => {
  it("expanderar kortform och sänker till gemener", () => {
    expect(normalizeHexColor("#ABC")).toBe("#aabbcc");
    expect(normalizeHexColor("#8B5CF6")).toBe("#8b5cf6");
  });

  it("returnerar null vid ogiltig indata", () => {
    expect(normalizeHexColor("nope")).toBeNull();
  });
});

describe("getReadableTextColor", () => {
  it("väljer mörk text på ljus bakgrund", () => {
    expect(getReadableTextColor("#ffffff")).toBe("#0f172a");
    expect(getReadableTextColor("#FFFC00")).toBe("#0f172a"); // Snapchat-gult
  });

  it("väljer vit text på mörk bakgrund", () => {
    expect(getReadableTextColor("#000000")).toBe("#ffffff");
    expect(getReadableTextColor("#0f172a")).toBe("#ffffff");
    expect(getReadableTextColor("#4f46e5")).toBe("#ffffff");
  });

  it("faller tillbaka när färgen saknas", () => {
    expect(getReadableTextColor(null, "#abc123")).toBe("#abc123");
    expect(getReadableTextColor("trasig", "#abc123")).toBe("#abc123");
  });
});

describe("hexToRgba", () => {
  it("konverterar till rgba", () => {
    expect(hexToRgba("#8b5cf6", 0.2)).toBe("rgba(139, 92, 246, 0.2)");
  });
});
