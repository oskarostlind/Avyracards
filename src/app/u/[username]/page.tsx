import { notFound } from "next/navigation";

import { ProfilePreview } from "@/components/profile-preview";
import { prisma } from "@/lib/prisma";

interface PublicProfilePageProps {
  params: { username: string };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: {
      username: true,
      bio: true,
      template: true,
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
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg">
      <ProfilePreview
        username={user.username}
        bio={user.bio}
        profileImage={user.profileImage}
        theme={user.template}
        links={user.links}
      />
    </div>
  );
}
