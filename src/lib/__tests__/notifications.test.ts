import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatAmount,
  renderCardOrderConfirmed,
  renderCardOrderShipped,
  renderPremiumActivated,
} from "@/lib/notifications/templates";
import {
  isValidRecipient,
  renderNotification,
  sendSystemNotification,
} from "@/lib/notifications";
import { getMailerConfig, isMailerConfigured } from "@/lib/mailer";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = "https://avyracards.se";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("mailer-konfiguration", () => {
  it("räknas som okonfigurerad när SMTP-variabler saknas", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.STRATO_SMTP_USER;
    delete process.env.STRATO_SMTP_PASS;

    expect(isMailerConfigured()).toBe(false);
    expect(getMailerConfig()).toBeNull();
  });

  it("faller tillbaka på STRATO-variablerna och bygger en from-adress", () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    process.env.SMTP_HOST = "smtp.strato.de";
    process.env.STRATO_SMTP_USER = "no-reply@avyracards.se";
    process.env.STRATO_SMTP_PASS = "hemligt";

    const config = getMailerConfig();
    expect(config).not.toBeNull();
    expect(config?.from).toBe("AvyraCards <no-reply@avyracards.se>");
    expect(config?.port).toBe(587);
    expect(config?.secure).toBe(false);
  });

  it("kräver alla tre delarna — bara host räcker inte", () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.STRATO_SMTP_USER;
    delete process.env.STRATO_SMTP_PASS;
    process.env.SMTP_HOST = "smtp.strato.de";

    expect(isMailerConfigured()).toBe(false);
  });
});

describe("formatAmount", () => {
  it("visar hela kronor utan decimaler", () => {
    expect(formatAmount(24900, "sek")).toBe("249 kr");
  });

  it("visar ören när beloppet inte är jämnt", () => {
    expect(formatAmount(24950, "sek")).toBe("249,50 kr");
  });

  it("tusentalsavgränsar", () => {
    expect(formatAmount(129900, "SEK")).toBe("1 299 kr");
  });

  it("faller tillbaka på valutakoden för andra valutor", () => {
    expect(formatAmount(1000, "eur")).toBe("10 EUR");
  });
});

describe("premium-mailet", () => {
  it("har källspecifik text för App Store-köp", () => {
    const mail = renderPremiumActivated({ name: "Oskar", source: "apple_iap" });
    expect(mail.subject).toContain("Premium");
    expect(mail.text).toContain("App Store");
    expect(mail.text).toContain("Hej Oskar!");
  });

  it("nämner kortbeställningen när premium ingick i en order", () => {
    const mail = renderPremiumActivated({ name: null, source: "card_order" });
    expect(mail.text).toContain("kortbeställning");
    expect(mail.text).toContain("Hej!");
  });

  it("tar med utgångsdatum när premium är tidsbegränsat", () => {
    const mail = renderPremiumActivated({
      source: "apple_iap",
      expiresAt: new Date("2027-02-01T10:00:00.000Z"),
    });
    expect(mail.text).toContain("2027-02-01");
    expect(mail.html).toContain("2027-02-01");
  });

  it("utelämnar utgångsraden när premium inte har något slutdatum", () => {
    const mail = renderPremiumActivated({ source: "gift", expiresAt: null });
    expect(mail.text).not.toContain("gäller till och med");
  });

  it("länkar till den kanoniska .se-domänen även när env pekar på .com", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://avyracards.com";
    const mail = renderPremiumActivated({ source: "stripe" });
    expect(mail.html).toContain("https://avyracards.se/profile/themes");
    expect(mail.html).not.toContain("avyracards.com");
  });
});

describe("ordermailen", () => {
  const order = {
    orderId: "cmxyz1234abcdefgh",
    quantity: 2,
    amountTotal: 59800,
    currency: "sek",
  };

  it("bekräftelsen innehåller ordernummer, antal och summa", () => {
    const mail = renderCardOrderConfirmed({ name: "Oskar Östlind", ...order });
    expect(mail.subject).toContain("ABCDEFGH");
    expect(mail.text).toContain("598 kr");
    expect(mail.text).toContain("2 kort");
  });

  it("skickatmailet nämner ort när den finns", () => {
    const mail = renderCardOrderShipped({
      name: "Oskar",
      orderId: order.orderId,
      quantity: 1,
      shippingCity: "Göteborg",
    });
    expect(mail.text).toContain("till Göteborg");
    expect(mail.text).toContain("ditt kort");
  });

  it("skickatmailet fungerar utan ort", () => {
    const mail = renderCardOrderShipped({
      orderId: order.orderId,
      quantity: 3,
      shippingCity: null,
    });
    expect(mail.text).not.toContain("till null");
    expect(mail.text).toContain("dina kort");
  });

  it("escapar HTML i namn så att ett kundnamn inte kan injicera markup", () => {
    const mail = renderCardOrderConfirmed({
      name: '<script>alert("x")</script>',
      ...order,
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("sendSystemNotification", () => {
  it("hoppar över utskick utan giltig mottagare", async () => {
    const result = await sendSystemNotification({
      type: "premium_activated",
      to: null,
      source: "stripe",
    });
    expect(result).toEqual({ sent: false, reason: "no_recipient" });
  });

  it("hoppar över uppenbart trasiga adresser", async () => {
    expect(isValidRecipient("inte-en-adress")).toBe(false);
    expect(isValidRecipient("  ")).toBe(false);
    expect(isValidRecipient("oskar@avyracards.se")).toBe(true);

    const result = await sendSystemNotification({
      type: "card_order_shipped",
      to: "inte-en-adress",
      orderId: "abc",
      quantity: 1,
    });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("no_recipient");
  });

  it("kastar aldrig när SMTP saknas — returnerar not_configured", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.STRATO_SMTP_USER;
    delete process.env.STRATO_SMTP_PASS;

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await sendSystemNotification({
      type: "card_order_confirmed",
      to: "kund@example.com",
      orderId: "cmxyz1234abcdefgh",
      quantity: 1,
      amountTotal: 24900,
      currency: "sek",
    });

    expect(result).toEqual({ sent: false, reason: "not_configured" });
    expect(warn).toHaveBeenCalled();
  });

  it("bygger rätt mall per händelsetyp", () => {
    const premium = renderNotification({
      type: "premium_activated",
      to: "a@b.se",
      source: "stripe",
    });
    const shipped = renderNotification({
      type: "card_order_shipped",
      to: "a@b.se",
      orderId: "cmxyz1234abcdefgh",
      quantity: 1,
    });

    expect(premium?.subject).not.toBe(shipped?.subject);
    expect(premium?.html).toContain("<!DOCTYPE html>");
    expect(shipped?.html).toContain("<!DOCTYPE html>");
  });
});
