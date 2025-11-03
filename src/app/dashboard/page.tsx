import { redirect } from "next/navigation";

import { LinksWorkspace } from "@/components/dashboard/links-workspace";
import { ProfilePreview } from "@/components/profile-preview";
import { prisma } from "@/lib/prisma";
import { auth } from "../api/auth/[...nextauth]/auth";

export default async function DashboardPage() {
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
      profileImage: true,
      links: { orderBy: { position: "asc" } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const visibleLinks = user.links.filter((link) => link.isVisible);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
      <LinksWorkspace
        initialLinks={user.links.map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
          isVisible: link.isVisible,
        }))}
      />
      <aside className="mobile-frame">
        <ProfilePreview
          username={user.username}
          bio={user.bio}
          profileImage={user.profileImage}
          theme={user.template}
          links={visibleLinks.map((link) => ({
            id: link.id,
            label: link.label,
            url: link.url,
            isVisible: link.isVisible,
          }))}
        />
      </aside>
    </div>
  );
}
