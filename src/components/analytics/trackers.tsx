"use client";

import { useEffect, useRef } from "react";

// --- VIEW TRACKER ---
export function ProfileViewTracker({ userId, sourceParam }: { userId: string, sourceParam?: string }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    // 1. Avgör källa
    let source = sourceParam || "direct"; // Prioritera ?source=nfc

    // Om ingen source via URL, kolla referrer (var kom man ifrån?)
    if (!sourceParam && typeof document !== "undefined" && document.referrer) {
      const ref = document.referrer.toLowerCase();
      
      if (ref.includes("instagram")) source = "Instagram";
      else if (ref.includes("facebook")) source = "Facebook";
      else if (ref.includes("linkedin")) source = "LinkedIn";
      else if (ref.includes("t.co") || ref.includes("twitter") || ref.includes("x.com")) source = "X (Twitter)";
      else if (ref.includes("google")) source = "Google";
      else if (ref.includes(window.location.hostname)) source = "Internal"; // Från egen sida
      else source = "Webbplats"; // Annan webbplats
    }

    // 2. Skicka event
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "VIEW",
        profileOwnerId: userId,
        source: source,
        device: getDeviceType(),
        referrer: document.referrer || undefined
      }),
    }).catch((err) => console.error("Tracking failed", err));
    
  }, [userId, sourceParam]);

  return null;
}

// --- LINK TRACKER ---
export function TrackedLink({ 
  linkId, 
  ownerId, 
  href, 
  children, 
  className,
  style 
}: any) {
  
  const handleClick = () => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "CLICK",
        profileOwnerId: ownerId,
        linkId: linkId,
        device: getDeviceType(),
      }),
    }).catch(() => {}); // Ignorera fel tyst för användaren
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}

function getDeviceType() {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "Mobile";
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}