import { describe, expect, it, vi } from "vitest";

import { isPrivateIp, lookupGeo, normalizeIp, resolveGeoDbPath, __resetGeoReader } from "@/lib/analytics/geo";
import { sanitizeDeepLink } from "@/lib/push-deep-link";

describe("normalizeIp", () => {
  it("plockar bort port från IPv4", () => {
    expect(normalizeIp("83.140.1.2:51234")).toBe("83.140.1.2");
    expect(normalizeIp("83.140.1.2")).toBe("83.140.1.2");
  });

  it("plockar bort brackets och port från IPv6", () => {
    expect(normalizeIp("[2001:db8::1]:443")).toBe("2001:db8::1");
    expect(normalizeIp("[2001:db8::1]")).toBe("2001:db8::1");
  });

  it("plockar bort zon-id", () => {
    expect(normalizeIp("fe80::1%eth0")).toBe("fe80::1");
  });

  it("trimmar och hanterar tomt", () => {
    expect(normalizeIp("  1.2.3.4  ")).toBe("1.2.3.4");
    expect(normalizeIp("")).toBeNull();
    expect(normalizeIp(undefined)).toBeNull();
    expect(normalizeIp(null)).toBeNull();
  });
});

describe("isPrivateIp", () => {
  it("känner igen loopback och privata nät", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.16.5.5", "172.31.9.9", "169.254.1.1", "::1", "fd00::1", "fe80::1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it("släpper igenom publika adresser", () => {
    for (const ip of ["83.140.1.2", "8.8.8.8", "172.32.0.1", "2001:db8::1"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });

  it("behandlar saknat IP som privat", () => {
    expect(isPrivateIp(undefined)).toBe(true);
    expect(isPrivateIp(null)).toBe(true);
  });
});

describe("lookupGeo", () => {
  it("returnerar null utan att kasta när databasen saknas", async () => {
    __resetGeoReader();
    vi.stubEnv("MAXMIND_DB_PATH", "/finns/inte/GeoLite2-City.mmdb");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(lookupGeo("83.140.1.2")).resolves.toBeNull();

    warn.mockRestore();
    vi.unstubAllEnvs();
    __resetGeoReader();
  });

  it("slår inte ens upp privata adresser", async () => {
    await expect(lookupGeo("127.0.0.1")).resolves.toBeNull();
    await expect(lookupGeo(undefined)).resolves.toBeNull();
  });
});

describe("resolveGeoDbPath", () => {
  it("respekterar MAXMIND_DB_PATH", () => {
    vi.stubEnv("MAXMIND_DB_PATH", "/data/city.mmdb");
    expect(resolveGeoDbPath()).toBe("/data/city.mmdb");
    vi.unstubAllEnvs();
  });

  it("faller tillbaka på geodata/GeoLite2-City.mmdb", () => {
    expect(resolveGeoDbPath().replace(/\\/g, "/")).toMatch(/geodata\/GeoLite2-City\.mmdb$/);
  });
});

describe("sanitizeDeepLink", () => {
  it("släpper igenom relativa sökvägar", () => {
    expect(sanitizeDeepLink("/dashboard/analytics?event=abc")).toBe(
      "/dashboard/analytics?event=abc",
    );
  });

  it("mappar kortformen /analytics till dashboarden", () => {
    expect(sanitizeDeepLink("/analytics?event=abc")).toBe("/dashboard/analytics?event=abc");
    expect(sanitizeDeepLink("/analytics")).toBe("/dashboard/analytics");
  });

  it("avvisar absoluta och protokoll-relativa adresser", () => {
    expect(sanitizeDeepLink("https://evil.com")).toBeNull();
    expect(sanitizeDeepLink("//evil.com")).toBeNull();
    expect(sanitizeDeepLink("/\\evil.com")).toBeNull();
    expect(sanitizeDeepLink("javascript:alert(1)")).toBeNull();
  });

  it("avvisar allt som inte är en sträng", () => {
    expect(sanitizeDeepLink(undefined)).toBeNull();
    expect(sanitizeDeepLink(42)).toBeNull();
    expect(sanitizeDeepLink({ url: "/x" })).toBeNull();
  });
});
