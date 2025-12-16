"use client";

import { useEffect } from "react";

// --- VIEW TRACKER ---
// Körs en gång när profilsidan laddas
export function ProfileViewTracker({ userId }: { userId: string }) {
  useEffect(() => {
    const trackView = async () => {
      // Försök hämta referrer från document
      const referrer = document.referrer || "direct";
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      try {
        await fetch("/api/analytics", {
          method: "POST",
          body: JSON.stringify({
            type: "VIEW",
            profileOwnerId: userId,
            referrer: referrer,
            device: isMobile ? "mobile" : "desktop",
          }),
        });
      } catch (e) {
        // Ignorera fel tyst för användaren
      }
    };

    trackView();
  }, [userId]);

  return null; // Renderar inget synligt
}

// --- CLICK TRACKER ---
// Wrapper runt länkar för att spåra klick

// Uppdaterat interface som inkluderar 'style'
interface TrackedLinkProps {
  linkId: string;
  ownerId: string;
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties; // <-- Här är fixen för ditt felmeddelande
}

export function TrackedLink({ 
  linkId, 
  ownerId, 
  href, 
  children, 
  className,
  style // <-- Tar emot style
}: TrackedLinkProps) {
  
  const handleClick = () => {
    // Använd sendBeacon om möjligt för att garantera att requesten går iväg även om sidan byts
    const data = JSON.stringify({
      type: "CLICK",
      profileOwnerId: ownerId,
      linkId: linkId,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", data);
    } else {
      // Fallback
      fetch("/api/analytics", { method: "POST", body: data });
    }
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      onClick={handleClick}
      className={className}
      style={style} // <-- Skickar vidare style till a-taggen
    >
      {children}
    </a>
  );
}