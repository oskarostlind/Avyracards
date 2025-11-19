"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { updateProfile } from "@/lib/actions/profile";
import { Profile } from "@/lib/validations/profile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProfileCard } from "@/components/profile-card";

type ProfileSettingsFormProps = {
  initialProfile: Profile;
};

export function ProfileSettingsForm({ initialProfile }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [state, formAction, isPending] = useActionState(updateProfile, {
    status: "idle",
  });
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPendingTransition, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [state, router, startTransition]);

  function handleProfileChange<K extends keyof Profile>(
    key: K,
    value: Profile[K]
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {/* Form */}
      <form
        action={formAction}
        className="space-y-8 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <input type="hidden" name="id" value={profile.id} />

        {/* Basic info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profilinformation</h2>
          <p className="text-sm text-muted-foreground">
            Uppdatera namn, användarnamn, titel och bio som visas på ditt
            SocialCard.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                name="name"
                value={profile.name ?? ""}
                onChange={(e) => handleProfileChange("name", e.target.value)}
                placeholder="Ditt namn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Användarnamn</Label>
              <Input
                id="username"
                name="username"
                value={profile.username ?? ""}
                onChange={(e) =>
                  handleProfileChange("username", e.target.value)
                }
                placeholder="oskar"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titel / roll</Label>
            <Input
              id="title"
              name="title"
              value={profile.title ?? ""}
              onChange={(e) => handleProfileChange("title", e.target.value)}
              placeholder="Säljare, Telia Company"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Kort bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={profile.bio ?? ""}
              onChange={(e) => handleProfileChange("bio", e.target.value)}
              placeholder="Berätta kort om dig själv..."
              rows={4}
            />
          </div>
        </div>

        {/* Profile image */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Profilbild</h3>
          <p className="text-sm text-muted-foreground">
            Ladda upp en profilbild som visas på ditt kort.
          </p>

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
              {profile.profileImageUrl ? (
                <Image
                  src={profile.profileImageUrl}
                  alt="Profilbild"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  Ingen bild
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Input
                type="url"
                name="profileImageUrl"
                placeholder="https://..."
                value={profile.profileImageUrl ?? ""}
                onChange={(e) =>
                  handleProfileChange("profileImageUrl", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Stöd för direktlänkar till bilder (t.ex. CDN, Imgur, Cloudinary
                m.m.). Filuppladdning kan läggas till senare.
              </p>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Synlighet</h3>
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
            <div className="space-y-1">
              <Label htmlFor="isPublic">Offentlig profil</Label>
              <p className="text-xs text-muted-foreground">
                När detta är aktiverat kan vem som helst besöka din publika
                profil via din unika länk.
              </p>
            </div>
            <Switch
              id="isPublic"
              name="isPublic"
              checked={profile.isPublic ?? false}
              onCheckedChange={(checked) =>
                handleProfileChange("isPublic", checked)
              }
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {state.status === "error" && (
              <span className="text-destructive">
                Något gick fel, försök igen.
              </span>
            )}
            {state.status === "success" && (
              <span className="text-emerald-600">
                Profilen uppdaterades – förhandsvisningen uppdateras strax.
              </span>
            )}
          </div>
          <Button type="submit" disabled={isPending || isPendingTransition}>
            {isPending || isPendingTransition ? "Sparar..." : "Spara profil"}
          </Button>
        </div>
      </form>

      {/* Live preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Förhandsvisning</h2>
          <p className="text-xs text-muted-foreground">
            Så här ser ditt SocialCard ut just nu.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-muted/40 p-4 shadow-sm">
          <div className="mx-auto max-w-sm">
            <ProfileCard
              username={profile.username || "ditt användarnamn"}
              bio={profile.bio || ""}
              profileImage={profile.profileImageUrl || undefined}
              className="bg-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
