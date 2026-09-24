import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/push", () => ({
  sendPushNotification: vi.fn(),
}));

import {
  isAdminAlertsEnabled,
  notifyAdmins,
  renderAdminAlert,
} from "@/lib/admin-alerts";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

const findMany = prisma.user.findMany as unknown as ReturnType<typeof vi.fn>;
const sendPush = sendPushNotification as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  findMany.mockReset();
  sendPush.mockReset();
  sendPush.mockResolvedValue(undefined);
  vi.stubEnv("ADMIN_PUSH_ALERTS", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAdminAlertsEnabled", () => {
  it("är av som standard utanför produktion", () => {
    expect(isAdminAlertsEnabled({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe(false);
    expect(isAdminAlertsEnabled({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(
      false
    );
  });

  it("är på som standard i produktion", () => {
    expect(isAdminAlertsEnabled({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(
      true
    );
  });

  it("låter ADMIN_PUSH_ALERTS gå före", () => {
    expect(
      isAdminAlertsEnabled({
        NODE_ENV: "production",
        ADMIN_PUSH_ALERTS: "false",
      } as NodeJS.ProcessEnv)
    ).toBe(false);
    expect(
      isAdminAlertsEnabled({ NODE_ENV: "test", ADMIN_PUSH_ALERTS: "1" } as NodeJS.ProcessEnv)
    ).toBe(true);
  });
});

describe("renderAdminAlert", () => {
  it("formaterar en beställning i kronor med stad och deeplink till admin/orders", () => {
    const rendered = renderAdminAlert({
      type: "new_order",
      orderId: "o1",
      quantity: 2,
      amountTotal: 49800,
      currency: "sek",
      customerEmail: "anna@example.com",
      city: "Luleå",
      source: "ios",
    });

    expect(rendered.title).toContain("Ny beställning");
    expect(rendered.body).toBe("2 kort för 498 kr till Luleå · anna@example.com · via appen");
    expect(rendered.url).toBe("/admin/orders");
  });

  it("döljer summan för gratisordrar", () => {
    const rendered = renderAdminAlert({
      type: "new_order",
      orderId: "o2",
      quantity: 1,
      amountTotal: 0,
      currency: "sek",
      source: "admin_gift",
    });

    expect(rendered.title).toContain("Gratisorder");
    expect(rendered.body).toBe("1 kort");
  });

  it("skriver ut användare med både namn och mail", () => {
    const rendered = renderAdminAlert({
      type: "new_user",
      email: "anna@example.com",
      username: "anna",
      via: "apple",
    });

    expect(rendered.body).toBe("@anna (anna@example.com) registrerade sig med Apple.");
    expect(rendered.url).toBe("/admin/users");
  });

  it("hanterar premium och kortaktivering", () => {
    expect(
      renderAdminAlert({ type: "premium_activated", email: "a@b.se", source: "apple_iap" })
        .body
    ).toBe("a@b.se blev premium via App Store.");
    expect(
      renderAdminAlert({ type: "card_claimed", cardCode: "ABC123", username: "anna" }).body
    ).toBe("@anna aktiverade kort ABC123.");
  });
});

describe("notifyAdmins", () => {
  it("skickar till varje admin med token, utan dubbletter", async () => {
    findMany.mockResolvedValue([
      { pushToken: "tok-1" },
      { pushToken: " tok-1 " },
      { pushToken: "tok-2" },
      { pushToken: "   " },
    ]);

    const sent = await notifyAdmins({
      type: "new_user",
      email: "anna@example.com",
      via: "email",
    });

    expect(sent).toBe(2);
    expect(findMany).toHaveBeenCalledWith({
      where: { role: "ADMIN", pushToken: { not: null } },
      select: { pushToken: true },
    });
    expect(sendPush).toHaveBeenCalledTimes(2);
    expect(sendPush.mock.calls[0][0]).toBe("tok-1");
    expect(sendPush.mock.calls[1][0]).toBe("tok-2");
    expect(sendPush.mock.calls[0][3]).toMatchObject({
      url: "/admin/users",
      kind: "admin_new_user",
    });
  });

  it("gör ingenting när flaggan är av", async () => {
    vi.stubEnv("ADMIN_PUSH_ALERTS", "false");

    const sent = await notifyAdmins({ type: "card_claimed" });

    expect(sent).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("kastar aldrig även om databasen fallerar", async () => {
    findMany.mockRejectedValue(new Error("db nere"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyAdmins({ type: "card_claimed" })).resolves.toBe(0);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
