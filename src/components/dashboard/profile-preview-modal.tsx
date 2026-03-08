"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

type ProfilePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  // NYTT: Tar emot mode
  mode: "SOCIAL" | "BUSINESS";
};

export function ProfilePreviewModal({ isOpen, onClose, username, mode }: ProfilePreviewModalProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      // FIX: Lägger till &mode=... i URL query params
      // Detta säger till publika sidan: "Visa Business-versionen även om den inte är aktiv live"
      setUrl(`/u/${username}?preview=true&mode=${mode}`); 
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, username, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-primary/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[400px] h-[85vh] flex flex-col bg-nordic-primary rounded-[3rem] border-8 border-nordic-highlight/40 shadow-2xl overflow-hidden ring-1 ring-slate-700">
        
        {/* Fake Mobile Header */}
        <div className="absolute top-0 left-0 right-0 h-7 bg-slate-900 z-10 flex justify-center items-end pb-1 border-b border-white/5">
            <div className="w-20 h-4 bg-black rounded-full"></div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-colors border border-white/10"
        >
          <X size={20} />
        </button>

        {/* Iframe Content */}
        <div className="flex-1 w-full h-full bg-nordic-primary pt-7">
            <iframe 
                src={url} 
                className="w-full h-full border-none"
                title="Profile Preview"
                // NYTT: Sandbox-attribut för säkerhet (valfritt men bra)
                sandbox="allow-scripts allow-same-origin allow-forms"
            />
        </div>

        {/* Fake Home Bar */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-700 rounded-full"></div>
      </div>

      <div className="absolute top-6 right-6 text-nordic-secondary/50 text-sm hidden sm:block font-medium">
         Tryck ESC för att stänga
      </div>
    </div>
  );
}