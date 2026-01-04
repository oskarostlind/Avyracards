"use client";

import { useState } from "react";
import type { User, Link } from "@prisma/client";
import { CollapsibleSection } from "@/components/dashboard/accordion";
import { AvatarUploader } from "@/components/avatar-uploader"; // IMPORTERAD

type BusinessProfileFormProps = {
  user: User & { links: Link[] };
};

export function BusinessProfileForm({ user }: BusinessProfileFormProps) {
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [companyName, setCompanyName] = useState(user.companyName ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [businessHeadline, setBusinessHeadline] = useState(
    user.businessHeadline ?? ""
  );

  const [businessPhone, setBusinessPhone] = useState(user.businessPhone ?? "");
  const [businessEmail, setBusinessEmail] = useState(user.businessEmail ?? "");
  const [bookingUrl, setBookingUrl] = useState(user.bookingUrl ?? "");
  const [vcardUrl, setVcardUrl] = useState(user.vcardUrl ?? "");

  const [expertiseTags, setExpertiseTags] = useState(user.expertiseTags ?? "");
  const [languages, setLanguages] = useState(user.languages ?? "");
  const [businessRegion, setBusinessRegion] = useState(
    user.businessRegion ?? ""
  );

  const [companyLogoUrl, setCompanyLogoUrl] = useState(
    user.companyLogoUrl ?? ""
  );
  const [companyDescription, setCompanyDescription] = useState(
    user.companyDescription ?? ""
  );
  const [companyWebsite, setCompanyWebsite] = useState(
    user.companyWebsite ?? ""
  );
  const [careerPageUrl, setCareerPageUrl] = useState(user.careerPageUrl ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setStatus(
          data?.error ??
            "Något gick fel när business-profilen skulle sparas. Försök igen."
        );
      } else {
        setStatus("✅ Business-profilen är uppdaterad.");
      }
    } catch (error) {
      console.error(error);
      setStatus(
        "⚠ Ett oväntat fel uppstod när business-profilen skulle sparas."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        {/*
        <h2 className="text-sm font-semibold text-nordic-secondary">
          Businessprofil – visitkorts-läge
        </h2>
        
        <p className="text-xs text-nordic-highlight">
          Denna information används när din profil är i{" "}
          <span className="font-semibold text-slate-100">Business-läge</span>{" "}
          och visas på /u/{user.username}.
        </p>
        */}
      </div>

      {/* HERO */}
      <CollapsibleSection
        title="Hero"
        description="Titel, företag, ort och en kort headline."
        defaultOpen
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Titel
            </label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Kundansvarig inom IT-lösningar"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Företag
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Företag AB"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Ort / region
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Umeå, Norra Sverige"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">
              Kort headline
            </label>
            <input
              value={businessHeadline}
              onChange={(e) => setBusinessHeadline(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Kundansvarig inom IT-lösningar | Telia Company"
            />
            <p className="text-[10px] text-nordic-highlight">
              En kort 1-rads pitch som visas högst upp på din businessprofil.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* KONTAKT & CTA */}
      <CollapsibleSection
        title="Kontakt & CTA"
        description="Telefon, e-post, bokningslänk och vCard."
        defaultOpen
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Telefon (business)
            </label>
            <input
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="+46 70 123 45 67"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              E-post (business)
            </label>
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="namn@företag.se"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">
              Boka-möte-länk
            </label>
            <input
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="https://calendly.com/ditt-namn/30min"
            />
            <p className="text-[10px] text-nordic-highlight">
              Besökare kan klicka direkt för att boka ett möte med dig.
            </p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-200">
              vCard-URL (valfritt)
            </label>
            <input
              value={vcardUrl}
              onChange={(e) => setVcardUrl(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="https://din-sajt.se/kontakt.vcf"
            />
            <p className="text-[10px] text-nordic-highlight">
              Används om du vill erbjuda en &quot;Spara kontakt&quot;-knapp
              (vCard).
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* NYCKELINFO */}
      <CollapsibleSection
        title="Nyckelinfo"
        description="Bransch/expertis, språk och region."
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Bransch / expertis
            </label>
            <input
              value={expertiseTags}
              onChange={(e) => setExpertiseTags(e.target.value)}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Telekom, B2B-försäljning, CRM / Salesforce"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                Språk
              </label>
              <input
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                placeholder="Svenska, Engelska"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                Region
              </label>
              <input
                value={businessRegion}
                onChange={(e) => setBusinessRegion(e.target.value)}
                className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                placeholder="Norra Sverige"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* FÖRETAGSSEKTION */}
      <CollapsibleSection
        title="Företagssektion"
        description="Logo, kort beskrivning och länkar till hemsida/karriär."
        defaultOpen={false}
      >
        <div className="space-y-3">
          
          {/* HÄR ÄR DEN NYA KOMPONENTEN */}
          <div className="space-y-1.5">
             <AvatarUploader
               label="Företagslogo"
               value={companyLogoUrl}
               onChange={(url) => setCompanyLogoUrl(url)}
               onUploadStart={() => setIsSaving(true)}
               onUploadEnd={() => setIsSaving(false)}
             />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-200">
              Kort text om företaget
            </label>
            <textarea
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Beskriv kort vad bolaget gör, målgrupp och erbjudande."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                Hemsida
              </label>
              <input
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                placeholder="https://företag.se"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200">
                Karriärsida
              </label>
              <input
                value={careerPageUrl}
                onChange={(e) => setCareerPageUrl(e.target.value)}
                className="w-full rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-xs text-nordic-secondary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                placeholder="https://företag.se/karriar"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* CTA */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-2xl bg-purple-500 px-4 py-2 text-xs font-medium text-nordic-secondary shadow-md shadow-purple-500/40 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Sparar..." : "Spara businessprofil"}
        </button>

        {status && <p className="text-[11px] text-nordic-highlight">{status}</p>}
      </div>
    </form>
  );
}