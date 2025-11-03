import Image from "next/image";

interface ProfileCardProps {
  username: string;
  bio?: string | null;
  profileImage?: string | null;
  className?: string;
}

export function ProfileCard({ username, bio, profileImage, className }: ProfileCardProps) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
          <Image src={profileImage ?? "/default-profile.png"} alt={username} fill className="object-cover" />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">@{username}</p>
          {bio && <p className="mt-2 text-sm opacity-80">{bio}</p>}
        </div>
      </div>
    </div>
  );
}
