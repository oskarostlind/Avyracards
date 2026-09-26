import { describe, it, expect } from "vitest";
import { fitWithin, LONG_SIDE } from "@/lib/prepare-upload-image";

describe("fitWithin", () => {
  it("skalar ner ett 12 MP iPhone-foto till LONG_SIDE på längsta sidan", () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 1920, height: LONG_SIDE, scale: LONG_SIDE / 4032 });
  });
  it("skalar ner 48 MP liggande och behåller proportioner", () => {
    const r = fitWithin(8064, 6048);
    expect(r.width).toBe(LONG_SIDE);
    expect(r.height).toBe(1920);
  });
  it("förstorar aldrig små bilder", () => {
    expect(fitWithin(1080, 1440)).toEqual({ width: 1080, height: 1440, scale: 1 });
  });
});
