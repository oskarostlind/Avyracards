import { afterEach, describe, expect, it } from "vitest";
import { detectNativePlatform } from "@/lib/native-platform";

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string };

function setCapacitor(cap: Cap | undefined) {
  (globalThis as unknown as { window: { Capacitor?: Cap } }).window = { Capacitor: cap };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("detectNativePlatform", () => {
  it("är web utan window (SSR)", () => {
    expect(detectNativePlatform()).toBe("web");
  });

  it("är web i en vanlig webbläsare", () => {
    setCapacitor(undefined);
    expect(detectNativePlatform()).toBe("web");
    setCapacitor({ isNativePlatform: () => false, getPlatform: () => "web" });
    expect(detectNativePlatform()).toBe("web");
  });

  it("är ios i iOS-appen — samma fall som useIsApp() täckte innan Android fanns", () => {
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => "ios" });
    expect(detectNativePlatform()).toBe("ios");
  });

  it("behandlar native utan getPlatform som ios (oförändrat iOS-beteende)", () => {
    setCapacitor({ isNativePlatform: () => true });
    expect(detectNativePlatform()).toBe("ios");
  });

  it("är android i Android-appen", () => {
    setCapacitor({ isNativePlatform: () => true, getPlatform: () => "android" });
    expect(detectNativePlatform()).toBe("android");
  });
});
