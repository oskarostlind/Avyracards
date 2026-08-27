import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Resend-klienten mockas för hela filen — inga riktiga utskick i testerna.
const resendSend = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendSend };
  },
}));

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
import {
  DEFAULT_MAIL_FROM,
  getMailerConfig,
  isMailerConfigured,
  sendMail,
} from "@/lib/mailer";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = "https://avyracards.se";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resendSend.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("mailer-konfiguration (Resend)", () => {
  it("räknas som okonfigurerad utan RESEND_API_KEY", () => {
    delete process.env.RESEND_API_KEY;

    expect(isMailerConfigured()).toBe(false);
    expect(getMailerConfig()).toBeNull();
  });

  it("använder standardavsändaren på den verifierade domänen", () => {
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.MAIL_FROM;
    delete process.env.SMTP_FROM;

    const config = getMailerConfig();
    expect(config?.from).toBe(DEFAULT_MAIL_FROM);
    expect(config?.from).toContain("@avyracards.se");
  });

  it("låter MAIL_FROM gå före den gamla SMTP_FROM-variabeln", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SMTP_FROM = "gammal@avyracards.se";
    process.env.MAIL_FROM = "AvyraCards <hej@avyracards.se>";

    expect(getMailerConfig()?.from).toBe("AvyraCards <hej@avyracards.se>");
  });

  it("faller tillbaka på SMTP_FROM så att en omigrerad miljö inte tystnar", () => {
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.MAIL_FROM;
    process.env.SMTP_FROM = "AvyraCards <gammal@avyracards.se>";

    expect(getMailerConfig()?.from).toBe("AvyraCards <gammal@avyracards.se>");
  });

  it("sätter replyTo bara när MAIL_REPLY_TO har ett värde", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.MAIL_REPLY_TO = "";
    expect(getMailerConfig()?.replyTo).toBeUndefined();

    process.env.MAIL_REPLY_TO = "support@avyracards.se";
    expect(getMailerConfig()?.replyTo).toBe("support@avyracards.se");
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

  it("visar loggan och den mörka headern i alla systemmail", () => {
    const mail = renderCardOrderConfirmed(order);
    expect(mail.html).toContain("https://avyracards.se/avyra-logo.png");
    expect(mail.html).toContain("#0f172a");
    // Bulletproof-knappen: bakgrunden ligger på <td>, inte bara på länken.
    expect(mail.html).toContain('bgcolor="#7c3aed"');
  });

  it("renderar produktrader med escapat namn och absoluta bild-URL:er", () => {
    const mail = renderCardOrderConfirmed({
      ...order,
      items: [
        { name: "Svart NFC-kort", quantity: 2, imageUrl: "/media/card-black.png" },
        { name: "Metallkort", quantity: 1, imageUrl: "https://cdn.example.com/metal.png" },
      ],
    });

    // Rot-relativ sökväg prefixas med baseUrl, absolut URL lämnas orörd.
    expect(mail.html).toContain("https://avyracards.se/media/card-black.png");
    expect(mail.html).toContain("https://cdn.example.com/metal.png");
    expect(mail.html).toContain("Svart NFC-kort");
    expect(mail.html).toContain("&times; 2");
    expect(mail.text).toContain("- Svart NFC-kort x 2");
  });

  it("hoppar över bilden i stället för att rendera en trasig img", () => {
    const mail = renderCardOrderConfirmed({
      ...order,
      items: [
        { name: "Utan bild", quantity: 1, imageUrl: null },
        { name: "Relativ sökväg", quantity: 1, imageUrl: "uploads/x.png" },
      ],
    });

    expect(mail.html).toContain("Utan bild");
    expect(mail.html).toContain("Relativ sökväg");
    expect(mail.html).not.toContain("<img src=\"uploads/x.png\"");
    // Bara loggan ska vara kvar som bild.
    expect(mail.html.match(/<img /g)?.length).toBe(1);
  });

  it("escapar produktnamn så att ett variantnamn inte kan injicera markup", () => {
    const mail = renderCardOrderConfirmed({
      ...order,
      items: [{ name: '<img src=x onerror="alert(1)">', quantity: 1, imageUrl: null }],
    });

    expect(mail.html).not.toContain('onerror="');
    expect(mail.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("gåvo-ordrar får egen rubrik och döljer summan", () => {
    const gift = renderCardOrderConfirmed({
      ...order,
      amountTotal: 0,
      isGift: true,
    });

    expect(gift.subject).toContain("Du har fått kort");
    expect(gift.subject).toContain("ABCDEFGH");
    expect(gift.html).toContain("Du har fått AvyraCards-kort!");
    expect(gift.text).toContain("kostnadsfritt");

    // Ingen summarad — "0 kr" ska aldrig visas för ett gratiskort.
    expect(gift.html).not.toContain("Summa");
    expect(gift.text).not.toContain("0 kr");

    // Leveransinfo och CTA finns kvar.
    expect(gift.html).toContain("aktiverar du det");
    expect(gift.html).toContain("https://avyracards.se/dashboard");
  });

  it("vanliga ordrar visar summan som en egen rad", () => {
    const mail = renderCardOrderConfirmed(order);
    expect(mail.html).toContain("Summa");
    expect(mail.html).toContain("598 kr");
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

  it("kastar aldrig när Resend saknas — returnerar not_configured", async () => {
    delete process.env.RESEND_API_KEY;

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

describe("utskick via Resend", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.MAIL_FROM;
    delete process.env.SMTP_FROM;
    delete process.env.MAIL_REPLY_TO;
  });

  it("skickar med avsändare, ämne och båda kroppsdelarna", async () => {
    resendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const result = await sendSystemNotification({
      type: "premium_activated",
      to: "  kund@example.com  ",
      name: "Oskar",
      source: "stripe",
    });

    expect(result).toEqual({ sent: true });
    expect(resendSend).toHaveBeenCalledTimes(1);

    const payload = resendSend.mock.calls[0][0];
    expect(payload.from).toBe(DEFAULT_MAIL_FROM);
    expect(payload.to).toBe("kund@example.com");
    expect(payload.subject).toContain("Premium");
    expect(payload.html).toContain("<!DOCTYPE html>");
    expect(payload.text).toContain("Hej Oskar!");
    expect(payload.replyTo).toBeUndefined();
  });

  it("skickar med replyTo när MAIL_REPLY_TO är satt", async () => {
    process.env.MAIL_REPLY_TO = "support@avyracards.se";
    resendSend.mockResolvedValue({ data: { id: "email-2" }, error: null });

    await sendSystemNotification({
      type: "card_order_shipped",
      to: "kund@example.com",
      orderId: "cmxyz1234abcdefgh",
      quantity: 1,
    });

    expect(resendSend.mock.calls[0][0].replyTo).toBe("support@avyracards.se");
  });

  it("behandlar Resends error-fält som ett fel — inte som lyckat utskick", async () => {
    // Resend kastar inte på API-fel. Utan den här kontrollen skulle ett avvisat
    // mail (t.ex. overifierad avsändardomän) se ut som ett lyckat utskick.
    resendSend.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Domain is not verified" },
    });

    await expect(
      sendMail({ to: "kund@example.com", subject: "Test", html: "<p>x</p>", text: "x" })
    ).rejects.toThrow(/Domain is not verified/);
  });

  it("returnerar send_failed i stället för att kasta när Resend avvisar", async () => {
    resendSend.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Domain is not verified" },
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendSystemNotification({
      type: "card_order_confirmed",
      to: "kund@example.com",
      orderId: "cmxyz1234abcdefgh",
      quantity: 1,
      amountTotal: 24900,
      currency: "sek",
    });

    expect(result).toEqual({ sent: false, reason: "send_failed" });
    expect(error).toHaveBeenCalled();
  });

  it("returnerar send_failed när nätverksanropet kastar", async () => {
    resendSend.mockRejectedValue(new Error("ECONNRESET"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendSystemNotification({
      type: "premium_activated",
      to: "kund@example.com",
      source: "gift",
    });

    expect(result).toEqual({ sent: false, reason: "send_failed" });
  });

  it("skickar inget alls när mottagaren är ogiltig", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendSystemNotification({
      type: "premium_activated",
      to: "trasig-adress",
      source: "stripe",
    });

    expect(resendSend).not.toHaveBeenCalled();
  });
});
