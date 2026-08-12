"use client";

import { useEffect, useRef } from "react";

// --- VIEW TRACKER ---
export function ProfileViewTracker({ userId, sourceParam }: { userId: string, sourceParam?: string }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    // Klienten skickar bara rådata. Härledningen av källa och enhet sker
    // centralt på servern (src/lib/analytics/events.ts) så att alla klienter
    // – webb, iOS-app, widget – ger samma statistik.
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "VIEW",
        profileOwnerId: userId,
        source: sourceParam || undefined,
        device: getDeviceType(),
        referrer: document.referrer || undefined,
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