/**
 * Direktlänk ("skicka besökaren direkt till en länk") — EN regel för hela appen.
 *
 * Redirect sker bara när användaren själv har valt en länk (redirectLinkId)
 * OCH den länken finns och är aktiv bland länkarna i det läge som visas.
 *
 * Historik: tidigare föll /u/[username] tillbaka på FÖRSTA länken när ingen
 * var vald, och redirectEnabled hade @default(true). Resultat: alla nya
 * användares profiler skickade besökare direkt till första länken, medan
 * dashboarden visade direktlänk som avslagen.
 */
export type RedirectLink = { id: string; url: string; isActive?: boolean | null };

export function resolveRedirectUrl(
  user: { redirectEnabled?: boolean | null; redirectLinkId?: string | null },
  links: RedirectLink[],
): string | null {
  if (!user.redirectEnabled || !user.redirectLinkId) return null;
  const target = links.find((l) => l.id === user.redirectLinkId && l.isActive !== false);
  return target?.url ?? null;
}
