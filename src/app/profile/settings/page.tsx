import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import type { ThemeName } from "@/utils/theme";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      bio: true,
      theme: true,
      font: true,
      avatarUrl: true,
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
          icon: true
        }
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileSettingsForm
      username={user.username}
      bio={user.bio}
      template={(user.theme as ThemeName | null) ?? "default"}
      fontFamily={user.font}
      profileImage={user.avatarUrl}
      links={user.links}
    />
  );
}
