"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function ConsentManager() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(localStorage.getItem("cookie_consent"));
  }, []);

  // Om användaren INTE godkänt -> Ladda inget
  if (consent !== "granted") return null;

  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2616665688666431"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    </>
  );
}