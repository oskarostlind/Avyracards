import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Komponenter
import { SettingsTabs } from "@/components/profile/settings-tabs";
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

  // 1. Hämta användaren och nödvändig data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true,
      passwordHash: true, // För att se om vi ska visa lösenordsbyte
      isPremium: true,
      stripeCustomerId: true, // VIKTIGT: För att hämta stripe-data
      marketingConsent: true,
      productUpdates: true,
      hideFromSearch: true,
      cards: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) redirect("/login");

  // 2. Hämta prenumerationsdata från Stripe (om användaren är Premium)
  let subscriptionData = null;

  if (user.isPremium && user.stripeCustomerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        // Vi plockar ut priset från första objektet i prenumerationen
        const priceItem = sub.items.data[0]?.price;

        if (priceItem) {
            subscriptionData = {
                status: sub.status,
                currentPeriodEnd: (sub as any).current_period_end, // Unix timestamp
                amount: priceItem.unit_amount || 0,
                currency: priceItem.currency,
                interval: priceItem.recurring?.interval || "month",
                createdAt: sub.created,
            };
        }
      }
    } catch (error) {
      console.error("Kunde inte hämta Stripe-data:", error);
      // Vi låter sidan ladda ändå, men utan detaljerad billing-info
    }
  }

  // 3. Bestäm vilken view som ska visas
  const view = typeof searchParams.view === "string" ? searchParams.view : "account";
  const hasPassword = !!user.passwordHash;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-nordic-secondary">Inställningar</h1>
        <p className="text-nordic-highlight">Hantera ditt konto, prenumeration och säkerhet.</p>
      </div>

      {/* Flik-navigation */}
      <SettingsTabs />

      {/* Rendra innehåll baserat på vald flik */}
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
          <BillingView 
            isPremium={user.isPremium} 
            subscription={subscriptionData}
          />
        )}

        {view === "cards" && (
          <CardsView cards={user.cards as any} />
        )}
      </div>
    </div>
  );
}