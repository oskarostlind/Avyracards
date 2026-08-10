"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, Link } from "@prisma/client";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { AvatarUploader } from "@/components/avatar-uploader";

type BusinessProfileFormProps = {
  user: User & { links: Link[] };
};

export function BusinessProfileForm({ user }: BusinessProfileFormProps) {
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
      setStatus("✔ Bilden är uppdaterad.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus("⚠ Kunde inte spara bilden. Försök igen.");
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
        setStatus(data?.error ?? "Något gick fel. Försök igen.");
      } else {
        setStatus("✅ Business-profilen är uppdaterad.");
        router.refresh(); 
      }
    } catch (error) {
      console.error(error);
      setStatus("⚠ Ett oväntat fel uppstod.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <CollapsibleSection
        title="Hero"
        description="Bild, titel, företag, ort och en kort headline."
        defaultOpen
      >
        <div className="space-y-4">
            
            {/* NYTT: UPLOADER FÖR BUSINESS AVATAR */}
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <AvatarUploader
                    label="Profilbild för Business-läge"
                    value={businessAvatarUrl}
                    onChange={(url) => {
                      setBusinessAvatarUrl(url);
                      void saveImageField("businessAvatarUrl", url);
                    }}
                    onUploadStart={() => setIsSaving(true)}
                    onUploadEnd={() => setIsSaving(false)}
                />
                <p className="text-[10px] text-slate-400 mt-2">Om du lämnar denna tom används din vanliga profilbild.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">Titel</label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Kundansvarig inom IT-lösningar" />
                </div>
                <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">Företag</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Företag AB" />
                </div>
                <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">Ort / region</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Umeå, Norra Sverige" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-medium text-slate-200">Kort headline</label>
                <input value={businessHeadline} onChange={(e) => setBusinessHeadline(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Kundansvarig inom IT-lösningar | Eriksson Company AB" />
                <p className="text-[10px] text-nordic-highlight">En kort 1-rads pitch som visas högst upp på din businessprofil.</p>
                </div>
            </div>
        </div>
      </CollapsibleSection>

      {/* ... Resten av sektionerna är oförändrade ... */}
      <CollapsibleSection title="Kontakt & CTA" description="Telefon, e-post, bokningslänk och vCard." defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">Telefon (business)</label>
            <input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="+46 70 123 45 67" />
            </div>
            <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">E-post (business)</label>
            <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="namn@företag.se" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">Boka-möte-länk</label>
            <input value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="https://calendly.com/ditt-namn/30min" />
            <p className="text-[10px] text-nordic-highlight">Besökare kan klicka direkt för att boka ett möte med dig.</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">vCard-URL (valfritt)</label>
            <input value={vcardUrl} onChange={(e) => setVcardUrl(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="https://din-sajt.se/kontakt.vcf" />
            <p className="text-[10px] text-nordic-highlight">Används om du vill erbjuda en &quot;Spara kontakt&quot;-knapp (vCard).</p>
            </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Nyckelinfo" description="Bransch/expertis, språk och region." defaultOpen={false}>
        <div className="space-y-3">
            <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">Bransch / expertis</label>
            <input value={expertiseTags} onChange={(e) => setExpertiseTags(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Telekom, B2B-försäljning, CRM / Salesforce" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">Språk</label>
                <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Svenska, Engelska" />
            </div>
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">Region</label>
                <input value={businessRegion} onChange={(e) => setBusinessRegion(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Norra Sverige" />
            </div>
            </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Företagssektion" description="Logo, kort beskrivning och länkar till hemsida/karriär." defaultOpen={false}>
        <div className="space-y-3">
            <div className="space-y-1.5">
                <AvatarUploader
                  label="Företagslogo"
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
            <label className="block text-xs font-medium text-slate-200">Kort text om företaget</label>
            <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="Beskriv kort vad bolaget gör, målgrupp och erbjudande." />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">Hemsida</label>
                <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40" placeholder="https://företag.se" />
            </div>
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">Karriärsida</label>
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
          {isSaving ? "Sparar..." : hasChanges ? "Spara ändringar" : "Spara"}
        </button>

        {status && <p className="text-[11px] text-nordic-highlight animate-in fade-in">{status}</p>}
      </div>
    </form>
  );
}