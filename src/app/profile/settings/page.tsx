import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Komponenter
import { SettingsTabs } from "@/components/profile/settings-tabs";
// Tog bort ProfileSettingsForm importen
import { AccountForm } from "@/components/profile/account-form";
import { BillingView } from "@/components/profile/billing-view";
import { CardsView } from "@/components/profile/cards-view";

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ProfileSettingsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true, // <-- NYTT
      passwordHash: true, // <-- NYTT (för att kolla om vi ska visa lösenordsbyte)
      isPremium: true,
      marketingConsent: true,
      productUpdates: true,
      hideFromSearch: true,
      cards: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) redirect("/login");

  const view = typeof searchParams.view === "string" ? searchParams.view : "account";
  const hasPassword = !!user.passwordHash; // Konvertera till boolean

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50">Inställningar</h1>
        <p className="text-slate-400">Hantera ditt konto, prenumeration och säkerhet.</p>
      </div>

      <SettingsTabs />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {view === "account" && (
          <AccountForm
            email={user.email!}
            username={user.username || ""}
            hasPassword={hasPassword}
            marketingConsent={user.marketingConsent}
            productUpdates={user.productUpdates}
            hideFromSearch={user.hideFromSearch}
          />
        )}

        {view === "billing" && (
          <BillingView isPremium={user.isPremium} />
        )}

        {view === "cards" && (
          <CardsView cards={user.cards as any} />
        )}
      </div>
    </div>
  );
}