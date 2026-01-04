"use client";

import Script from "next/script";
import { useEffect } from "react";

const PUB_ID = "ca-pub-2616665688666431";

export function GoogleAdSenseScript() {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

export function AdBanner() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error", err);
    }
  }, []);

  return (
    <div className="my-6 flex justify-center overflow-hidden rounded-xl bg-nordic-primary/50 p-2">
      <ins
        className="adsbygoogle"
        style={{ display: "block", minWidth: "300px", minHeight: "250px" }}
        data-ad-client={PUB_ID}
        data-ad-slot="auto" // Byt ut till specifikt slot-ID om du skapar en unit i AdSense
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}