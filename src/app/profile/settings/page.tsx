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
      template: true,
      fontFamily: true,
      profileImage: true,
      links: {
        where: { isVisible: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          label: true,
          url: true,
          isVisible: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileSettingsForm
      username={user.username}
      bio={user.bio}
      template={(user.template as ThemeName | null) ?? "default"}
      fontFamily={user.fontFamily}
      profileImage={user.profileImage}
      links={user.links}
    />
  );
}
