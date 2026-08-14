import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OrderView, { DbVariant } from "@/components/order-view";
import { getProfileData, MappedProfileData } from "@/lib/profile-mapper";
import { CustomThemeSettings, defaultSettings, ThemeMode } from "@/types/theme";

function mapVariant(variant: any): DbVariant {
    return {
        id: variant.id,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        colorCode: variant.colorCode,
        type: variant.type || "standard",
    };
}

export default async function OrderPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Hämta användaren inkl. länkar och tema — profilförhandsvisningen i
  //    köpflödet ska visa KUNDENS riktiga profil, inte mock-data.
  let isPremium = false;
  let profileData: MappedProfileData | null = null;
  let profileSettings: CustomThemeSettings | null = null;

  if (userId) {
     const user = await prisma.user.findUnique({
         where: { id: userId },
         include: {
           links: { orderBy: { order: "asc" } },
         },
     });

     if (user) {
        isPremium = user.isPremium === true;

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

  // 2. Hämta produkter
  const standardProduct = await prisma.product.findUnique({
    where: { slug: "standard-card" },
    include: { variants: { where: { isActive: true } } }
  });

  const metalProduct = await prisma.product.findUnique({
    where: { slug: "metal-card" },
    include: { variants: { where: { isActive: true } } }
  });

  const bundleProduct = await prisma.product.findUnique({
    where: { slug: "premium-bundle" },
    include: { variants: { where: { isActive: true } } }
  });

  // Månadspriset för premium hämtas från DB (visning/jämförelse i nivåvalet)
  const premiumProduct = await prisma.product.findUnique({
    where: { slug: "premium-subscription" },
    include: { variants: { where: { isActive: true }, take: 1 } }
  });
  const premiumMonthlyOre = premiumProduct?.variants[0]?.price ?? 6900;

  const standardVariants: DbVariant[] = standardProduct?.variants.map(mapVariant) || [];
  const metalVariants: DbVariant[] = metalProduct?.variants.map(mapVariant) || [];
  const bundleVariant: DbVariant | null = bundleProduct?.variants[0] ? mapVariant(bundleProduct.variants[0]) : null;

  return (
    <OrderView
      standardVariants={standardVariants}
      metalVariants={metalVariants}
      bundleVariant={bundleVariant}
      isPremium={isPremium}
      isLoggedIn={Boolean(userId)}
      profileData={profileData}
      profileSettings={profileSettings}
      premiumMonthlyOre={premiumMonthlyOre}
    />
  );
}
