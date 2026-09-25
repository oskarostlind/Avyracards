"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, Link } from "@prisma/client";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { AvatarUploader } from "@/components/avatar-uploader";
import { useT } from "@/i18n/client";
import { SaveBar, TextAreaField, TextField, withHttps } from "@/components/dashboard/form-kit";
import { useDashboardToast } from "@/components/dashboard/dashboard-toast";

type BusinessProfileFormProps = {
  user: User & { links: Link[] };
  /** Rapporterar osparade ändringar uppåt (varning vid lägesbyte). */
  onDirtyChange?: (dirty: boolean) => void;
};

export function BusinessProfileForm({ user, onDirtyChange }: BusinessProfileFormProps) {
  const t = useT();
  const router = useRouter();
  const toast = useDashboardToast();
  
  // NYTT STATE
  const [businessAvatarUrl, setBusinessAvatarUrl] = useState(user.businessAvatarUrl ?? "");

  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [businessHeadline, setBusinessHeadline] = useState(user.businessHeadline ?? "");

  const [businessPhone, setBusinessPhone] = useState(user.businessPhone ?? "");
  const [businessEmail, setBusinessEmail] = useState(user.businessEmail ?? "");
  const [bookingUrl, setBookingUrl] = useState(user.bookingUrl ?? "");
  const [vcardUrl, setVcardUrl] = useState(user.vcardUrl ?? "");

  const [expertiseTags, setExpertiseTags] = useState(user.expertiseTags ?? "");
  const [languages, setLanguages] = useState(user.languages ?? "");
  const [businessRegion, setBusinessRegion] = useState(user.businessRegion ?? "");

  const [companyLogoUrl, setCompanyLogoUrl] = useState(user.companyLogoUrl ?? "");
  const [companyDescription, setCompanyDescription] = useState(user.companyDescription ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(user.companyWebsite ?? "");
  const [careerPageUrl, setCareerPageUrl] = useState(user.careerPageUrl ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasChanges =
    businessAvatarUrl !== (user.businessAvatarUrl ?? "") || // Check change
    jobTitle !== (user.jobTitle ?? "") ||
    companyName !== (user.companyName ?? "") ||
    location !== (user.location ?? "") ||
    businessHeadline !== (user.businessHeadline ?? "") ||
    businessPhone !== (user.businessPhone ?? "") ||
    businessEmail !== (user.businessEmail ?? "") ||
    bookingUrl !== (user.bookingUrl ?? "") ||
    vcardUrl !== (user.vcardUrl ?? "") ||
    expertiseTags !== (user.expertiseTags ?? "") ||
    languages !== (user.languages ?? "") ||
    businessRegion !== (user.businessRegion ?? "") ||
    companyLogoUrl !== (user.companyLogoUrl ?? "") ||
    companyDescription !== (user.companyDescription ?? "") ||
    companyWebsite !== (user.companyWebsite ?? "") ||
    careerPageUrl !== (user.careerPageUrl ?? "");

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const discard = () => {
    setBusinessAvatarUrl(user.businessAvatarUrl ?? "");
    setJobTitle(user.jobTitle ?? "");
    setCompanyName(user.companyName ?? "");
    setLocation(user.location ?? "");
    setBusinessHeadline(user.businessHeadline ?? "");
    setBusinessPhone(user.businessPhone ?? "");
    setBusinessEmail(user.businessEmail ?? "");
    setBookingUrl(user.bookingUrl ?? "");
    setVcardUrl(user.vcardUrl ?? "");
    setExpertiseTags(user.expertiseTags ?? "");
    setLanguages(user.languages ?? "");
    setBusinessRegion(user.businessRegion ?? "");
    setCompanyLogoUrl(user.companyLogoUrl ?? "");
    setCompanyDescription(user.companyDescription ?? "");
    setCompanyWebsite(user.companyWebsite ?? "");
    setCareerPageUrl(user.careerPageUrl ?? "");
  };

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

  // FIX (ClickUp 86c9nv6uw): spara bilder direkt vid uppladdning i stället för
  // att kräva ett extra klick på "Spara ändringar" — användare missade steget
  // och trodde att bytet av profilbild misslyckats.
  const saveImageField = async (field: "businessAvatarUrl" | "companyLogoUrl", url: string) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: url || null }),
      });
      if (!res.ok) throw new Error("Failed to save image");
      toast({ message: t("businessForm.imageUpdated"), tone: "success" });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ message: t("businessForm.imageFailed"), tone: "error" });
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!hasChanges || isSaving) return;

    // "foretag.se" -> "https://foretag.se": servern kräver fullständig URL i
    // dessa fält och svarade tidigare bara "ogiltiga fält".
    const booking = withHttps(bookingUrl);
    const vcard = withHttps(vcardUrl);
    const website = withHttps(companyWebsite);
    const career = withHttps(careerPageUrl);
    setBookingUrl(booking);
    setVcardUrl(vcard);
    setCompanyWebsite(website);
    setCareerPageUrl(career);

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessAvatarUrl: businessAvatarUrl || null,
          jobTitle: jobTitle || null,
          companyName: companyName || null,
          location: location || null,
          businessHeadline: businessHeadline || null,

          businessPhone: businessPhone || null,
          businessEmail: businessEmail || null,
          bookingUrl: booking || null,
          vcardUrl: vcard || null,

          expertiseTags: expertiseTags || null,
          languages: languages || null,
          businessRegion: businessRegion || null,

          companyLogoUrl: companyLogoUrl || null,
          companyDescription: companyDescription || null,
          companyWebsite: website || null,
          careerPageUrl: career || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast({ message: data?.error ?? t("common.somethingWentWrong"), tone: "error" });
      } else {
        toast({ message: t("businessForm.updated"), tone: "success" });
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast({ message: t("businessForm.unexpectedError"), tone: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const urlProps = {
    type: "text" as const,
    inputMode: "url" as const,
    autoCapitalize: "none",
    autoCorrect: "off",
    spellCheck: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <CollapsibleSection title={t("businessForm.hero")} description={t("businessForm.heroDesc")} defaultOpen>
        <div>
          <AvatarUploader
            label={t("businessForm.businessAvatar")}
            value={businessAvatarUrl}
            onChange={(url) => {
              setBusinessAvatarUrl(url);
              void saveImageField("businessAvatarUrl", url);
            }}
            onUploadStart={() => setUploading(true)}
            onUploadEnd={() => setUploading(false)}
          />
          <p className="mt-2 text-[13px] text-slate-500">{t("businessForm.businessAvatarHint")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={t("businessForm.jobTitle")} value={jobTitle} maxLength={120} onChange={(e) => setJobTitle(e.target.value)} placeholder={t("businessForm.jobTitlePlaceholder")} />
          <TextField label={t("businessForm.company")} value={companyName} maxLength={160} autoComplete="organization" onChange={(e) => setCompanyName(e.target.value)} placeholder={t("businessForm.companyPlaceholder")} />
          <TextField label={t("businessForm.location")} value={location} maxLength={160} onChange={(e) => setLocation(e.target.value)} placeholder={t("businessForm.locationPlaceholder")} />
          <TextField
            className="md:col-span-2"
            label={t("businessForm.headline")}
            value={businessHeadline}
            maxLength={200}
            onChange={(e) => setBusinessHeadline(e.target.value)}
            placeholder={t("businessForm.headlinePlaceholder")}
            hint={t("businessForm.headlineHint")}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("businessForm.contactSection")} description={t("businessForm.contactSectionDesc")} defaultOpen={false}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={t("businessForm.phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={50} value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder={t("profileForm.phonePlaceholder")} />
          <TextField label={t("businessForm.email")} type="email" inputMode="email" autoCapitalize="none" autoComplete="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder={t("profileForm.contactEmailPlaceholder")} />
          <TextField className="md:col-span-2" label={t("businessForm.bookingUrl")} {...urlProps} value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} onBlur={(e) => setBookingUrl(withHttps(e.target.value))} placeholder="calendly.com/ditt-namn/30min" hint={t("businessForm.bookingUrlHint")} />
          <TextField className="md:col-span-2" label={t("businessForm.vcardUrl")} {...urlProps} value={vcardUrl} onChange={(e) => setVcardUrl(e.target.value)} onBlur={(e) => setVcardUrl(withHttps(e.target.value))} placeholder={t("businessForm.vcardUrlPlaceholder")} hint={t("businessForm.vcardUrlHint")} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("businessForm.keyInfo")} description={t("businessForm.keyInfoDesc")} defaultOpen={false}>
        <TextField label={t("businessForm.expertise")} value={expertiseTags} maxLength={500} onChange={(e) => setExpertiseTags(e.target.value)} placeholder={t("businessForm.expertisePlaceholder")} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={t("businessForm.languages")} value={languages} maxLength={200} onChange={(e) => setLanguages(e.target.value)} placeholder={t("businessForm.languagesPlaceholder")} />
          <TextField label={t("businessForm.region")} value={businessRegion} maxLength={160} onChange={(e) => setBusinessRegion(e.target.value)} placeholder={t("businessForm.regionPlaceholder")} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("businessForm.companySection")} description={t("businessForm.companySectionDesc")} defaultOpen={false}>
        <AvatarUploader
          label={t("businessForm.companyLogo")}
          value={companyLogoUrl}
          onChange={(url) => {
            setCompanyLogoUrl(url);
            void saveImageField("companyLogoUrl", url);
          }}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
        />
        <TextAreaField label={t("businessForm.companyDescription")} value={companyDescription} maxLength={1000} onChange={(e) => setCompanyDescription(e.target.value)} placeholder={t("businessForm.companyDescriptionPlaceholder")} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={t("businessForm.website")} {...urlProps} value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} onBlur={(e) => setCompanyWebsite(withHttps(e.target.value))} placeholder="företag.se" />
          <TextField label={t("businessForm.careerPage")} {...urlProps} value={careerPageUrl} onChange={(e) => setCareerPageUrl(e.target.value)} onBlur={(e) => setCareerPageUrl(withHttps(e.target.value))} placeholder="företag.se/karriar" />
        </div>
      </CollapsibleSection>

      <SaveBar
        dirty={hasChanges}
        saving={isSaving || uploading}
        onDiscard={discard}
        saveLabel={t("profileForm.saveChanges")}
        savingLabel={t("common.saving")}
        discardLabel={t("dashboard.profile.discard")}
        hint={t("dashboard.profile.unsaved")}
      />
    </form>
  );
}
