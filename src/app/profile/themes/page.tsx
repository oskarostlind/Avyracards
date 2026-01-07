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
      isPremium: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      // --- NYA FÄLT FÖR BUSINESS PREVIEW ---
      profileMode: true,
      jobTitle: true,
      companyName: true,
      location: true,
      businessEmail: true,
      businessPhone: true,
      companyWebsite: true,
      // -------------------------------------
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!user) redirect("/login");

  const savedSettings = (user.themeSettings as unknown as Partial<CustomThemeSettings>) || {};
  const safeSettings: CustomThemeSettings = { ...defaultSettings, ...savedSettings };

  const liveUserData = {
    username: user.username || "",
    name: user.name || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    
    // --- SKICKA VIDARE NY DATA ---
    profileMode: user.profileMode as "SOCIAL" | "BUSINESS", 
    jobTitle: user.jobTitle,
    companyName: user.companyName,
    location: user.location,
    businessEmail: user.businessEmail,
    businessPhone: user.businessPhone,
    companyWebsite: user.companyWebsite,
    // -----------------------------

    links: user.links.map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon || undefined,
      mode: l.mode as "SOCIAL" | "BUSINESS" // Viktigt för filtreringen!
    })),
    isPremium: user.isPremium
  };

  return (
    <ThemeEditor 
      initialSettings={safeSettings} 
      userData={liveUserData} 
    />
  );
}