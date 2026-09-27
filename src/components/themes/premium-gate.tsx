"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ButtonVariant, FrameStyle, NameEffect, ThemeTemplate } from "@/types/theme";
import type { AccessUser } from "@/lib/feature-access";

/*
 * Premium-grinden i temaeditorn.
 *
 * Alla flikar frågar samma ställe när något låst trycks på, och skickar med
 * VAD som trycktes på. Då kan uppgraderingsrutan visa just det levande (ramen
 * på användarens egen bild, knappen i användarens färger …) i stället för en
 * generisk text — och alla lås beter sig likadant.
 *
 * Behörigheten avgörs fortfarande av src/lib/feature-access.ts; det här är
 * bara presentationen av "det här är premium".
 */

export type PremiumTeaser =
  | { kind: "frame"; frame: FrameStyle }
  | { kind: "nameEffect"; effect: NameEffect }
  | { kind: "font"; fontId: string; target: "heading" | "body" }
  | { kind: "buttonVariant"; variant: ButtonVariant }
  | { kind: "animatedBackground" }
  | { kind: "backgroundImage" }
  | { kind: "hideBranding" }
  | { kind: "template"; template: ThemeTemplate }
  | { kind: "generic" };

interface PremiumGateValue {
  accessUser: AccessUser;
  /** Öppna uppgraderingsrutan med en förhandsvisning av det som trycktes på. */
  requestPremium: (teaser?: PremiumTeaser) => void;
}

const PremiumGateContext = createContext<PremiumGateValue | null>(null);

export function PremiumGateProvider({
  accessUser,
  onRequest,
  children,
}: {
  accessUser: AccessUser;
  onRequest: (teaser: PremiumTeaser) => void;
  children: ReactNode;
}) {
  const { isPremium, isAdmin } = accessUser;
  const value = useMemo<PremiumGateValue>(
    () => ({
      accessUser: { isPremium, isAdmin },
      requestPremium: (teaser) => onRequest(teaser ?? { kind: "generic" }),
    }),
    [isPremium, isAdmin, onRequest],
  );
  return <PremiumGateContext.Provider value={value}>{children}</PremiumGateContext.Provider>;
}

const NOOP_GATE: PremiumGateValue = { accessUser: {}, requestPremium: () => {} };

/** Grinden för närmaste temaeditor. Utanför editorn: inget konto, inget händer. */
export function usePremiumGate(): PremiumGateValue {
  return useContext(PremiumGateContext) ?? NOOP_GATE;
}
