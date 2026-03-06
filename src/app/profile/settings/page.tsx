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

  // 1. Hämta användaren
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true,
      passwordHash: true, 
      isPremium: true,
      stripeCustomerId: true,
      marketingConsent: true,
      productUpdates: true,
      hideFromSearch: true,
      cards: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) redirect("/login");

  // 2. Hämta prenumerationsdata från Stripe
  let subscriptionData = null;

  if (user.isPremium && user.stripeCustomerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'all', 
        limit: 1,
        expand: ['data.default_payment_method']
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0] as any;
        
        const priceItem = sub.items.data[0]?.price;
        const nextBillingDate = sub.trial_end ? sub.trial_end : sub.current_period_end;

        let paymentMethodBrand = "";
        let paymentMethodLast4 = "";
        
        if (sub.default_payment_method && typeof sub.default_payment_method !== 'string') {
             paymentMethodBrand = sub.default_payment_method.card?.brand;
             paymentMethodLast4 = sub.default_payment_method.card?.last4;
        }

        if (priceItem) {
            subscriptionData = {
                status: sub.status,
                currentPeriodEnd: nextBillingDate, 
                amount: priceItem.unit_amount || 0,
                currency: priceItem.currency,
                interval: priceItem.recurring?.interval || "month",
                createdAt: sub.created,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                brand: paymentMethodBrand,
                last4: paymentMethodLast4
            };
        }
      }
    } catch (error) {
      console.error("Kunde inte hämta Stripe-data:", error);
    }
  }

  const view = typeof searchParams.view === "string" ? searchParams.view : "account";
  const hasPassword = !!user.passwordHash;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      
      {/* Glow Effects - Ger djup åt den mörka bakgrunden (samma som dashboard) */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Innehållet */}
      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-nordic-secondary">Inställningar</h1>
          <p className="text-nordic-highlight">Hantera ditt konto, prenumeration och säkerhet.</p>
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
            <BillingView 
              isPremium={user.isPremium} 
              subscription={subscriptionData}
            />
          )}

          {view === "cards" && (
            // @ts-ignore - Fixar ev. typ-mismatch
            <CardsView cards={user.cards} />
          )}
        </div>
      </div>
    </div>
  );
}