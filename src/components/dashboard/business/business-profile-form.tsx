"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, Link } from "@prisma/client";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { AvatarUploader } from "@/components/avatar-uploader";
import { useT } from "@/i18n/client";

type BusinessProfileFormProps = {
  user: User & { links: Link[] };
};

export function BusinessProfileForm({ user }: BusinessProfileFormProps) {
  const t = useT();
  const router = useRouter();
  
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
  const [status, setStatus] = useState<string | null>(null);

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
      setStatus(t("businessForm.imageUpdated"));
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus(t("businessForm.imageFailed"));
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessAvatarUrl: businessAvatarUrl || null, // Skicka nya bilden
          jobTitle: jobTitle || null,
          companyName: companyName || null,
          location: location || null,
          businessHeadline: businessHeadline || null,

          businessPhone: businessPhone || null,
          businessEmail: businessEmail || null,
          bookingUrl: bookingUrl || null,
          vcardUrl: vcardUrl || null,

          expertiseTags: expertiseTags || null,
          languages: languages || null,
          businessRegion: businessRegion || null,

          companyLogoUrl: companyLogoUrl || null,
          companyDescription: companyDescription || null,
          companyWebsite: companyWebsite || null,
          careerPageUrl: careerPageUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus(data?.error ?? t("common.somethingWentWrong"));
      } else {
        setStatus(t("businessForm.updated"));
        router.refresh(); 
      }
    } catch (error) {
      console.error(error);
      setStatus(t("businessForm.unexpectedError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <CollapsibleSection
        title={t("businessForm.hero")}
        description={t("businessForm.heroDesc")}
        defaultOpen
      >
        <div className="space-y-4">
            
            {/* NYTT: UPLOADER FÖR BUSINESS AVATAR */}
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <AvatarUploader
                    label={t("businessForm.businessAvatar")}
                    value={businessAvatarUrl}
                    onChange={(url) => {
                      setBusinessAvatarUrl(url);
                      void saveImageField("businessAvatarUrl", url);
                    }}
                    onUploadStart={() => setIsSaving(true)}
                    onUploadEnd={() => setIsSaving(false)}
                />
                <p className="text-[10px] text-slate-400 mt-2">{t("businessForm.businessAvatarHint")}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.jobTitle")}</label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.jobTitlePlaceholder")} />
                </div>
                <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.company")}</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.companyPlaceholder")} />
                </div>
                <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.location")}</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.locationPlaceholder")} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.headline")}</label>
                <input value={businessHeadline} onChange={(e) => setBusinessHeadline(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.headlinePlaceholder")} />
                <p className="text-[10px] text-nordic-highlight">{t("businessForm.headlineHint")}</p>
                </div>
            </div>
        </div>
      </CollapsibleSection>

      {/* ... Resten av sektionerna är oförändrade ... */}
      <CollapsibleSection title={t("businessForm.contactSection")} description={t("businessForm.contactSectionDesc")} defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">{t("businessForm.phone")}</label>
            <input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("profileForm.phonePlaceholder")} />
            </div>
            <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">{t("businessForm.email")}</label>
            <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("profileForm.contactEmailPlaceholder")} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">{t("businessForm.bookingUrl")}</label>
            <input value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="https://calendly.com/ditt-namn/30min" />
            <p className="text-[10px] text-nordic-highlight">{t("businessForm.bookingUrlHint")}</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">{t("businessForm.vcardUrl")}</label>
            <input value={vcardUrl} onChange={(e) => setVcardUrl(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.vcardUrlPlaceholder")} />
            <p className="text-[10px] text-nordic-highlight">{t("businessForm.vcardUrlHint")}</p>
            </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("businessForm.keyInfo")} description={t("businessForm.keyInfoDesc")} defaultOpen={false}>
        <div className="space-y-3">
            <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">{t("businessForm.expertise")}</label>
            <input value={expertiseTags} onChange={(e) => setExpertiseTags(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.expertisePlaceholder")} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.languages")}</label>
                <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.languagesPlaceholder")} />
            </div>
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.region")}</label>
                <input value={businessRegion} onChange={(e) => setBusinessRegion(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.regionPlaceholder")} />
            </div>
            </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={t("businessForm.companySection")} description={t("businessForm.companySectionDesc")} defaultOpen={false}>
        <div className="space-y-3">
            <div className="space-y-1.5">
                <AvatarUploader
                  label={t("businessForm.companyLogo")}
                  value={companyLogoUrl}
                  onChange={(url) => {
                    setCompanyLogoUrl(url);
                    void saveImageField("companyLogoUrl", url);
                  }}
                  onUploadStart={() => setIsSaving(true)}
                  onUploadEnd={() => setIsSaving(false)}
                />
            </div>
            <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">{t("businessForm.companyDescription")}</label>
            <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder={t("businessForm.companyDescriptionPlaceholder")} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.website")}</label>
                <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="https://företag.se" />
            </div>
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">{t("businessForm.careerPage")}</label>
                <input value={careerPageUrl} onChange={(e) => setCareerPageUrl(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="https://företag.se/karriar" />
            </div>
            </div>
        </div>
      </CollapsibleSection>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!hasChanges || isSaving}
          className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-xs font-medium shadow-md transition-all disabled:cursor-not-allowed ${
            hasChanges 
              ? "bg-purple-500 text-nordic-secondary hover:bg-purple-400 shadow-purple-500/40" 
              : "bg-slate-800 text-slate-500 border border-slate-700"
          }`}
        >
          {isSaving ? t("common.saving") : hasChanges ? t("profileForm.saveChanges") : t("common.save")}
        </button>

        {status && <p className="text-[11px] text-nordic-highlight animate-in fade-in">{status}</p>}
      </div>
    </form>
  );
}