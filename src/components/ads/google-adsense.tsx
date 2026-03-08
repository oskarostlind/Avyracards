"use client";

import { useEffect, useRef } from "react";

export function AdBanner() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Vi kollar så att vi inte råkar ladda in scriptet två gånger om komponenten renderas om
    const scriptId = "adsterra-script-707e5c";
    
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.dataset.cfasync = "false";
      script.src = "https://pl28868469.effectivegatecpm.com/707e5c051ad988b5e9a9c87d8c4f685f/invoke.js";
      
      // Vi lägger till scriptet i webbläsaren
      document.body.appendChild(script);
    }

    // Cleanup: Valfritt, men bra för att städa upp om man navigerar iväg
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="flex w-full items-center justify-center overflow-hidden py-2" ref={wrapperRef}>
      {/* Här är den specifika ID-containern som Adsterra letar efter för att rita ut annonsen */}
      <div id="container-707e5c051ad988b5e9a9c87d8c4f685f"></div>
    </div>
  );
}