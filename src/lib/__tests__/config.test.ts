import { describe, expect, it } from "vitest";
import {
  getAppEnvironment,
  getStripeKeyMode,
  getStripeModeReport,
  isProductionEnvironment,
  type EnvSource,
} from "../config/environment";
import { buildConfigReport, type ConfigCheck } from "../config/health";

/** Minimal, fullt korrekt produktionsmiljö — utgångspunkt för avvikelsetester. */
function healthyProdEnv(): EnvSource {
  return {
    VERCEL_ENV: "production",
    NODE_ENV: "production",
    NEXT_PUBLIC_BASE_URL: "https://avyracards.se",
    NEXTAUTH_SECRET: "s",
    DATABASE_URL: "postgres://x",
    BLOB_READ_WRITE_TOKEN: "t",
    STRIPE_SECRET_KEY: "sk_live_abc",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
    STRIPE_WEBHOOK_SECRET: "whsec_abc",
    NEXT_PUBLIC_IOS_NATIVE_PAYMENTS: "true",
    APPLE_IAP_PREMIUM_MONTHLY: "m",
    APPLE_IAP_PREMIUM_6MO: "s6",
    APPLE_IAP_KEY_ID: "k",
    APPLE_IAP_ISSUER_ID: "i",
    APPLE_IAP_PRIVATE_KEY: "p",
    RESEND_API_KEY: "re_live_abc",
    MAIL_FROM: "AvyraCards <no-reply@avyracards.se>",
  };
}

function findCheck(env: EnvSource, id: string): ConfigCheck {
  const report = buildConfigReport(env);
  const check = report.groups.flatMap((g) => g.checks).find((c) => c.id === id);
  if (!check) throw new Error(`Kontrollen "${id}" saknas i rapporten`);
  return check;
}

describe("getAppEnvironment", () => {
  it("låter VERCEL_ENV avgöra, så att preview inte förväxlas med produktion", () => {
    expect(getAppEnvironment({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(
      "preview",
    );
    expect(isProductionEnvironment({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(
      false,
    );
  });

  it("faller tillbaka på NODE_ENV när VERCEL_ENV saknas", () => {
    expect(getAppEnvironment({ NODE_ENV: "production" })).toBe("production");
    expect(getAppEnvironment({ NODE_ENV: "development" })).toBe("development");
    expect(getAppEnvironment({})).toBe("development");
  });
});

describe("getStripeKeyMode", () => {
  it("känner igen live, test och saknad nyckel", () => {
    expect(getStripeKeyMode("sk_live_1")).toBe("live");
    expect(getStripeKeyMode("pk_test_1")).toBe("test");
    expect(getStripeKeyMode(undefined)).toBe("missing");
    expect(getStripeKeyMode("")).toBe("missing");
  });

  it("behandlar platshållaren i stripe.ts som saknad nyckel", () => {
    expect(getStripeKeyMode("sk_test_missing_key_placeholder")).toBe("missing");
  });
});

describe("getStripeModeReport", () => {
  it("flaggar blandade lägen mellan hemlig och publik nyckel", () => {
    const report = getStripeModeReport({
      STRIPE_SECRET_KEY: "sk_live_a",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_a",
      VERCEL_ENV: "production",
    });
    expect(report.consistent).toBe(false);
  });

  it("kräver live-nyckel i produktion och testnyckel i övriga miljöer", () => {
    expect(
      getStripeModeReport({ STRIPE_SECRET_KEY: "sk_test_a", VERCEL_ENV: "production" })
        .matchesEnvironment,
    ).toBe(false);
    expect(
      getStripeModeReport({ STRIPE_SECRET_KEY: "sk_test_a", VERCEL_ENV: "preview" })
        .matchesEnvironment,
    ).toBe(true);
  });
});

describe("buildConfigReport", () => {
  it("ger noll fel för en korrekt uppsatt produktionsmiljö", () => {
    const report = buildConfigReport(healthyProdEnv());
    expect(report.errorCount).toBe(0);
    expect(report.environment).toBe("production");
  });

  it("larmar när iOS-native-betalningar inte är påslaget i produktion (App Store 3.1.1)", () => {
    const env = healthyProdEnv();
    delete env.NEXT_PUBLIC_IOS_NATIVE_PAYMENTS;
    expect(findCheck(env, "ios-native-payments").status).toBe("error");
  });

  it("larmar även när flaggan är satt till fel sträng — bara \"true\" räknas", () => {
    const env = { ...healthyProdEnv(), NEXT_PUBLIC_IOS_NATIVE_PAYMENTS: "1" };
    expect(findCheck(env, "ios-native-payments").status).toBe("error");
  });

  it("larmar på testnyckel i produktion", () => {
    const env = {
      ...healthyProdEnv(),
      STRIPE_SECRET_KEY: "sk_test_a",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_a",
    };
    expect(findCheck(env, "stripe-secret").status).toBe("error");
  });

  it("varnar för live-nyckel i preview i stället för att larma", () => {
    const env = { ...healthyProdEnv(), VERCEL_ENV: "preview" };
    expect(findCheck(env, "stripe-secret").status).toBe("warn");
  });

  it("larmar på http/localhost i NEXT_PUBLIC_BASE_URL i produktion", () => {
    const env = { ...healthyProdEnv(), NEXT_PUBLIC_BASE_URL: "http://localhost:3000" };
    expect(findCheck(env, "base-url").status).toBe("error");
  });

  it("larmar på saknad RESEND_API_KEY i produktion men inte lokalt", () => {
    const prod = healthyProdEnv();
    delete prod.RESEND_API_KEY;
    expect(findCheck(prod, "resend").status).toBe("error");

    const dev: EnvSource = {
      ...healthyProdEnv(),
      VERCEL_ENV: "development",
      NODE_ENV: "development",
    };
    delete dev.RESEND_API_KEY;
    expect(findCheck(dev, "resend").status).toBe("off");
  });

  it("varnar när avsändaren ligger på en domän som inte är verifierad i Resend", () => {
    const env = healthyProdEnv();
    env.MAIL_FROM = "AvyraCards <no-reply@avyracards.com>";
    expect(findCheck(env, "mail-from").status).toBe("warn");
  });

  it("godtar standardavsändaren när MAIL_FROM inte är satt", () => {
    const env = healthyProdEnv();
    delete env.MAIL_FROM;
    expect(findCheck(env, "mail-from").status).toBe("ok");
  });

  it("faller tillbaka på SMTP_FROM, samma kedja som mailer.ts", () => {
    const env = healthyProdEnv();
    delete env.MAIL_FROM;
    env.SMTP_FROM = "AvyraCards <gammal@avyracards.se>";
    const check = findCheck(env, "mail-from");
    expect(check.status).toBe("ok");
    expect(check.detail).toContain("gammal@avyracards.se");
  });

  it("läcker aldrig ett hemligt värde till rapporten", () => {
    const env = {
      ...healthyProdEnv(),
      STRIPE_SECRET_KEY: "sk_live_SUPERHEMLIGT",
      NEXTAUTH_SECRET: "SUPERHEMLIGT",
      RESEND_API_KEY: "re_SUPERHEMLIGT",
    };
    const text = JSON.stringify(buildConfigReport(env));
    expect(text).not.toContain("SUPERHEMLIGT");
  });

  it("sätter worst till högsta allvarlighetsgrad", () => {
    const env = healthyProdEnv();
    delete env.DATABASE_URL;
    expect(buildConfigReport(env).worst).toBe("error");
    expect(buildConfigReport(healthyProdEnv()).worst).toBe("ok");
  });
});
