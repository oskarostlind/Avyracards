import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { MapPin, Globe, Mail, Phone, Briefcase } from "lucide-react";
import type { User, Link as LinkModel } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getTheme } from "@/utils/theme";
import { AdBanner } from "@/components/ads/google-adsense";
import { ProfileViewTracker, TrackedLink } from "@/components/analytics/trackers";

type PageProps = {
  params: { username: string };
};

type UserWithLinks = User & { links: LinkModel[] };

export const runtime = "nodejs";
export const revalidate = 0;

export default async function PublicProfilePage({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Redirect logic
  if (user.redirectEnabled && user.links.length > 0) {
    const primary = user.links[0];
    const target = normalizeUrl(primary.url);
    redirect(target);
  }

  const showAds = !user.isPremium;

  return (
    <>
      {/* Spåra visning */}
      <ProfileViewTracker userId={user.id} />

      {user.profileMode === "BUSINESS" ? (
        <BusinessProfile user={user} showAds={showAds} />
      ) : (
        <SocialProfile user={user} showAds={showAds} />
      )}
    </>
  );
}

// ---------- SOCIAL LAYOUT ----------

function SocialProfile({ user, showAds }: { user: UserWithLinks; showAds: boolean }) {
  const tokens = getTheme(user.theme);
  const displayName = user.name || user.username;
  const bio = user.bio;

  return (
    <main className={`min-h-screen ${tokens.bg || 'bg-slate-950'} ${tokens.text || 'text-slate-50'}`}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-4 py-12">
        
        {/* Profile Card */}
        <section className={`w-full rounded-[32px] border p-8 shadow-2xl backdrop-blur-md ${tokens.card}`}>
          <div className="flex flex-col items-center gap-5">
            {/* Avatar */}
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/10 shadow-xl">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={displayName} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-800 text-4xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              {bio && <p className={`text-sm leading-relaxed max-w-[280px] mx-auto ${tokens.textMuted}`}>{bio}</p>}
            </div>
          </div>

          {/* Links */}
          <div className="mt-8 flex flex-col gap-4">
            {user.links.map((link) => (
              <TrackedLink
                key={link.id}
                linkId={link.id}
                ownerId={user.id}
                href={normalizeUrl(link.url)}
                className={`flex items-center justify-between rounded-xl px-5 py-4 text-sm font-medium shadow-md transition-all hover:scale-[1.02] hover:shadow-lg ${tokens.link}`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{getSocialIcon(link.url || link.title)}</span>
                  <span>{link.title || link.url}</span>
                </span>
              </TrackedLink>
            ))}
          </div>

          {/* Ads */}
          {showAds && <AdBanner />}
        </section>

        {/* Branding Footer */}
        {!user.isPremium && (
          <div className="mt-8 text-xs text-slate-500 font-medium">
            Powered by <span className="text-slate-300">SocialCard</span>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------- BUSINESS LAYOUT ----------

function BusinessProfile({ user, showAds }: { user: UserWithLinks; showAds: boolean }) {
  const tokens = getTheme(user.theme); 
  
  const displayName = user.name || user.username;
  const headline = user.businessHeadline || user.jobTitle || "Business Profile";
  const company = user.companyName;

  return (
    <main className={`min-h-screen font-sans ${tokens.bg} ${tokens.text}`}>
      {/* Hero Header */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-900">
        {user.backgroundUrl ? (
           <Image src={user.backgroundUrl} alt="Cover" fill className="object-cover opacity-60" />
        ) : (
           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${tokens.bg ? tokens.bg.replace('bg-', 'from-') : 'from-slate-950'} to-transparent`} />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 -mt-20 relative pb-12">
        {/* Business Card Container */}
        <div className={`rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-md ${tokens.card}`}>
          
          {/* Header Content */}
          <div className="p-6 sm:p-8 border-b border-white/5">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-4 border-white/10 shadow-lg bg-gray-800 flex-shrink-0">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={displayName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                   <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
                   <div className={`flex flex-wrap gap-2 text-sm font-medium ${tokens.textMuted}`}>
                      {user.jobTitle && <span className="flex items-center gap-1"><Briefcase size={14}/> {user.jobTitle}</span>}
                      {company && <span>@ {company}</span>}
                   </div>
                   {user.location && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                         <MapPin size={12}/> {user.location}
                      </div>
                   )}
                </div>
            </div>

            {headline && (
               <p className={`mt-6 text-sm leading-relaxed border-l-4 border-blue-500/50 pl-4 py-2 italic bg-white/5 rounded-r-lg ${tokens.textMuted}`}>
                  &quot;{headline}&quot;
               </p>
            )}
          </div>

          {/* Quick Actions (Contact) */}
          <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5">
             {user.businessPhone && (
                <a href={`tel:${user.businessPhone}`} className={`p-4 flex items-center justify-center gap-2 transition font-medium text-sm hover:bg-white/5 ${tokens.text}`}>
                   <Phone size={16} className="text-blue-400"/> Ring
                </a>
             )}
             {user.businessEmail && (
                <a href={`mailto:${user.businessEmail}`} className={`p-4 flex items-center justify-center gap-2 transition font-medium text-sm hover:bg-white/5 ${tokens.text}`}>
                   <Mail size={16} className="text-blue-400"/> Maila
                </a>
             )}
             {user.companyWebsite && (
                <a href={normalizeUrl(user.companyWebsite)} target="_blank" className={`p-4 flex items-center justify-center gap-2 transition font-medium text-sm col-span-2 border-t border-white/5 hover:bg-white/5 ${tokens.text}`}>
                   <Globe size={16} className="text-blue-400"/> Besök hemsida
                </a>
             )}
          </div>

          {/* Links List */}
          {user.links.length > 0 && (
             <div className="p-6 bg-black/20">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Resurser & Länkar</h3>
                <div className="space-y-3">
                   {user.links.map((link) => (
                      <TrackedLink
                         key={link.id}
                         linkId={link.id}
                         ownerId={user.id}
                         href={normalizeUrl(link.url)}
                         className={`flex items-center justify-between p-4 rounded-xl border border-white/5 shadow-sm transition-all group hover:border-white/20 hover:bg-white/5 ${tokens.card}`}
                      >
                         <div className="flex items-center gap-3">
                            <span className="text-xl group-hover:scale-110 transition-transform">{getBusinessIcon(link.url || link.title)}</span>
                            <span className={`font-medium ${tokens.text}`}>{link.title || link.url}</span>
                         </div>
                         <span className="text-gray-500 group-hover:text-white">→</span>
                      </TrackedLink>
                   ))}
                </div>
             </div>
          )}

          {/* Ads */}
          {showAds && (
             <div className="p-4 border-t border-white/5 text-center bg-black/20">
                <p className="text-[10px] text-gray-600 uppercase mb-2">Annons</p>
                <div className="mx-auto max-w-[300px] overflow-hidden rounded-lg">
                   <AdBanner />
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        {!user.isPremium && (
           <div className="text-center mt-8">
              <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold shadow-lg hover:bg-white/20 transition border border-white/10">
                 <span className="text-blue-400">⚡</span> Skapa ditt eget SocialCard
              </a>
           </div>
        )}
      </div>
    </main>
  );
}

// ---------- HELPERS ----------

function normalizeUrl(url: string): string {
  if (!url) return "/";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  if (/^tel:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getSocialIcon(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("instagram")) return "📸";
  if (s.includes("tiktok")) return "🎵";
  if (s.includes("youtube")) return "▶️";
  if (s.includes("linkedin")) return "💼";
  if (s.includes("twitter") || s.includes("x.com")) return "🐦";
  if (s.includes("spotify")) return "🎧";
  if (s.includes("github")) return "💻";
  return "🔗";
}

function getBusinessIcon(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("linkedin")) return "👔";
  if (s.includes("calendar") || s.includes("calendly")) return "📅";
  if (s.includes("pdf") || s.includes("drive")) return "📄";
  if (s.includes("zoom") || s.includes("teams")) return "📹";
  return "📌";
}