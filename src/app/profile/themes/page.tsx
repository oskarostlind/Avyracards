import { redirect } from "next/navigation";
import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { ThemeEditor } from "@/components/themes/theme-editor";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";

export default async function ThemesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      themeSettings: true, 
      businessThemeSettings: true,
      isPremium: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      
      // NYTT: Hämta business-bilden
      businessAvatarUrl: true,
      
      profileMode: true,
      jobTitle: true,
      companyName: true,
      location: true,
      
      businessHeadline: true,
      businessEmail: true,
      businessPhone: true,
      companyWebsite: true,
      bookingUrl: true, // Bra att ha med om du använder den

      // NYA FÄLT FÖR SOCIAL
      contactEmail: true,
      phoneNumber: true,

      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        // VIKTIGT: Explicit select för att garantera att 'mode' kommer med
        select: {
            id: true,
            title: true,
            url: true,
            icon: true,
            mode: true, // <--- Fixar dubblett-felet i preview
            isActive: true
        }
      }
    }
  });

  if (!user) redirect("/login");

  const savedSocial = (user.themeSettings as unknown as Partial<CustomThemeSettings>) || {};
  const safeSocialSettings: CustomThemeSettings = { ...defaultSettings, ...savedSocial };

  const savedBusiness = (user.businessThemeSettings as unknown as Partial<CustomThemeSettings>) || {};
  const safeBusinessSettings: CustomThemeSettings = { ...defaultSettings, ...savedBusiness };

  const liveUserData = {
    username: user.username || "",
    name: user.name || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    // NYTT: Skicka med business-bilden
    businessAvatarUrl: user.businessAvatarUrl || null,
    
    profileMode: user.profileMode as "SOCIAL" | "BUSINESS", 
    jobTitle: user.jobTitle,
    companyName: user.companyName,
    location: user.location,
    
    businessHeadline: user.businessHeadline,
    businessEmail: user.businessEmail,
    businessPhone: user.businessPhone,
    companyWebsite: user.companyWebsite,
    bookingUrl: (user as any).bookingUrl,

    // SKICKAR MED SOCIAL KONTAKTDATA
    contactEmail: user.contactEmail,
    phoneNumber: user.phoneNumber,

    links: user.links.map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon || undefined,
      mode: l.mode as "SOCIAL" | "BUSINESS", // Nu är detta värde korrekt från databasen
      isActive: true
    })),
    isPremium: user.isPremium
  };

  return (
    <ThemeEditor 
      initialSettings={safeSocialSettings} 
      initialBusinessSettings={safeBusinessSettings} 
      userData={liveUserData} 
    />
  );
}