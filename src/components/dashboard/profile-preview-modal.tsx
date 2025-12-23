"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

type ProfilePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  username: string;
};

export function ProfilePreviewModal({ isOpen, onClose, username }: ProfilePreviewModalProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Sätter URL när modalen öppnas för att tvinga en reload av iframen
      setUrl(`/u/${username}?preview=true`); 
      document.body.style.overflow = "hidden"; // Lås scroll
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, username]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[400px] h-[85vh] flex flex-col bg-slate-950 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Fake Mobile Header */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 z-10 flex justify-center">
            <div className="w-20 h-4 bg-slate-900 rounded-b-xl"></div>
        </div>

        {/* Close Button (Outside or absolute) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Iframe Content */}
        <div className="flex-1 w-full h-full bg-white pt-6">
            <iframe 
                src={url} 
                className="w-full h-full border-none"
                title="Profile Preview"
            />
        </div>

        {/* Fake Home Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-800 rounded-full mb-2"></div>
      </div>

      <div className="absolute top-4 right-4 text-white/50 text-sm hidden sm:block">
         Tryck ESC för att stänga
      </div>
    </div>
  );
}