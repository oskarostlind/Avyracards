import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PremiumCheckoutForm } from "@/components/premium-checkout-form";
import { getProfileData, MappedProfileData } from "@/lib/profile-mapper";
import { CustomThemeSettings, defaultSettings, ThemeMode } from "@/types/theme";

export default async function PremiumCheckoutPage() {

  const product = await prisma.product.findUnique({
    where: { slug: "premium-subscription" },
    include: { variants: true }
  });

  if (!product || product.variants.length === 0) {
    redirect("/get-started");
  }

  const variant = product.variants[0];

  // Visa kundens riktiga profil i previewn i stället för mock-data
  const session = await auth();
  const userId = session?.user?.id;

  let profileData: MappedProfileData | null = null;
  let profileSettings: CustomThemeSettings | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { links: { orderBy: { order: "asc" } } },
    });

    if (user) {
      const mode: ThemeMode = (user.profileMode as ThemeMode) || "SOCIAL";
      profileData = getProfileData(user, mode);

      const savedSettings = mode === "BUSINESS"
        ? user.businessThemeSettings
        : user.themeSettings;
      profileSettings = {
        ...defaultSettings,
        ...((savedSettings as object) || {}),
      };
    }
  }

  return (
    <PremiumCheckoutForm
      productName={product.name}
      price={variant.price}
      variantId={variant.id}
      profileData={profileData}
      profileSettings={profileSettings}
    />
  );
}
