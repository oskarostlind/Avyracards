import { describe, expect, it } from "vitest";
import { walletKindsForUserAgent } from "../wallet/platform";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

describe("walletKindsForUserAgent", () => {
  it("erbjuder bara Apple Wallet på iPhone — en .pkpass är det enda som fungerar där", () => {
    expect(walletKindsForUserAgent(IPHONE)).toEqual(["apple"]);
  });

  it("erbjuder bara Google Wallet på Android — Android kan inte öppna en .pkpass", () => {
    expect(walletKindsForUserAgent(ANDROID)).toEqual(["google"]);
  });

  it("låter Android vinna över \"like Mac OS X\" i user agent-strängen", () => {
    const chromeOnAndroid =
      "Mozilla/5.0 (Linux; Android 13; SM-S918B like Mac OS X) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
    expect(walletKindsForUserAgent(chromeOnAndroid)).toEqual(["google"]);
  });

  it("visar båda på dator, där ingen av dem kan uteslutas", () => {
    expect(walletKindsForUserAgent(MAC)).toEqual(["apple", "google"]);
    expect(walletKindsForUserAgent(WINDOWS)).toEqual(["apple", "google"]);
  });

  it("faller tillbaka på båda när user agent saknas", () => {
    expect(walletKindsForUserAgent(null)).toEqual(["apple", "google"]);
    expect(walletKindsForUserAgent("")).toEqual(["apple", "google"]);
  });
});
