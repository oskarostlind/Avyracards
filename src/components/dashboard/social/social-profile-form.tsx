"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarUploader } from "@/components/avatar-uploader";
import { useT } from "@/i18n/client";
import { FormSection, SaveBar, TextAreaField, TextField } from "@/components/dashboard/form-kit";
import { useDashboardToast } from "@/components/dashboard/dashboard-toast";

type ProfileFormProps = {
  user: {
    id?: string;
    name?: string | null;
    bio?: string | null;
    username?: string | null;
    phoneNumber?: string | null;
    contactEmail?: string | null;
    avatarUrl?: string | null;
    redirectEnabled?: boolean | null;
  };
  /** Rapporterar osparade ändringar uppåt (varning vid lägesbyte). */
  onDirtyChange?: (dirty: boolean) => void;
};

export function SocialProfileForm({ user, onDirtyChange }: ProfileFormProps) {
  const t = useT();
  const router = useRouter();
  const toast = useDashboardToast();

  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [contactEmail, setContactEmail] = useState(user.contactEmail ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasChanges =
    name !== (user.name ?? "") ||
    bio !== (user.bio ?? "") ||
    phoneNumber !== (user.phoneNumber ?? "") ||
    contactEmail !== (user.contactEmail ?? "") ||
    avatarUrl !== (user.avatarUrl ?? null);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  // Varning vid osparade ändringar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const discard = () => {
    setName(user.name ?? "");
    setBio(user.bio ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
    setContactEmail(user.contactEmail ?? "");
    setAvatarUrl(user.avatarUrl ?? null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, phoneNumber, contactEmail, avatarUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data && typeof data.error === "string" && data.error) || t("profileForm.updateFailed"));
      }
      toast({ message: t("profileForm.updated"), tone: "success" });
      router.refresh(); // ny "user"-prop -> hasChanges blir false
    } catch (err) {
      console.error(err);
      toast({ message: err instanceof Error ? err.message : t("profileForm.updateFailed"), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormSection title={t("dashboard.sections.profileInfo")} description={t("dashboard.sections.profileInfoDesc")}>
        {/* FIX (ClickUp 86c9nv6uw): profilbilden sparas direkt vid uppladdning. */}
        <AvatarUploader
          label={t("profileForm.avatar")}
          value={avatarUrl}
          onChange={async (url) => {
            setAvatarUrl(url);
            try {
              const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: url }),
              });
              if (!res.ok) throw new Error("Failed to save avatar");
              toast({ message: t("profileForm.avatarUpdated"), tone: "success" });
              router.refresh();
            } catch (err) {
              console.error(err);
              toast({ message: t("profileForm.avatarFailed"), tone: "error" });
            }
          }}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
        />
        <TextField
          label={t("profileForm.name")}
          value={name}
          maxLength={100}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
          placeholder={t("profileForm.namePlaceholder")}
        />
        <TextAreaField
          label={t("profileForm.bio")}
          value={bio}
          maxLength={1000}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("profileForm.bioPlaceholder")}
        />
      </FormSection>

      <FormSection title={t("dashboard.profile.contactTitle")} description={t("dashboard.profile.contactDesc")}>
        <TextField
          label={t("profileForm.phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t("profileForm.phonePlaceholder")}
        />
        <TextField
          label={t("profileForm.contactEmail")}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder={t("profileForm.contactEmailPlaceholder")}
        />
      </FormSection>

      <SaveBar
        dirty={hasChanges}
        saving={saving || uploading}
        onDiscard={discard}
        saveLabel={t("profileForm.saveChanges")}
        savingLabel={t("common.saving")}
        discardLabel={t("dashboard.profile.discard")}
        hint={t("dashboard.profile.unsaved")}
      />
    </form>
  );
}
