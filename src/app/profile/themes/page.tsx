import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { ThemeEditor } from "@/components/themes/theme-editor";
import { CustomThemeSettings } from "@/types/theme";

export default async function ThemesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { themeSettings: true, isPremium: true }
  });

  if (!user) redirect("/login");

  // Om ej premium -> redirecta eller visa "Upgrade" (du kan bygga det sen)
  if (!user.isPremium) {
     // För nu, låt oss bara redirecta till settings om de inte får vara här
     redirect("/profile/settings"); 
  }

  return (
    <ThemeEditor initialSettings={user.themeSettings as CustomThemeSettings} />
  );
}