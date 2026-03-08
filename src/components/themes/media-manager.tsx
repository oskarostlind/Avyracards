"use client";

import { useState } from "react";
import { Upload, Search, Lock } from "lucide-react";
import { ImageUploader } from "./image-uploader";
import { UnsplashPicker } from "./unsplash-picker";

interface MediaManagerProps {
  onImageSelected: (url: string) => void;
  isPremium: boolean;
  onShowUpgrade: () => void;
}

export function MediaManager({ onImageSelected, isPremium, onShowUpgrade }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "unsplash">("upload");

  return (
    <div className="rounded-xl border border-nordic-highlight/40 bg-slate-900/30 overflow-hidden">
      
      {/* Header Tabs */}
      <div className="flex border-b border-nordic-highlight/40">
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === "upload" 
            ? "bg-slate-800 text-white" 
            : "text-nordic-highlight hover:text-slate-300 hover:bg-slate-900"
          }`}
        >
          <Upload size={14} />
          Ladda upp
        </button>
        <div className="w-px bg-nordic-highlight/40" />
        <button
          onClick={() => setActiveTab("unsplash")}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === "unsplash" 
            ? "bg-slate-800 text-white" 
            : "text-nordic-highlight hover:text-slate-300 hover:bg-slate-900"
          }`}
        >
          <Search size={14} />
          Unsplash
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 relative">
        
        {/* LÅS-OVERLAY OM INTE PREMIUM (Visuellt i hörnet) */}
        {!isPremium && (
            <div className="absolute top-2 right-2 z-10">
                 <div className="bg-amber-500 text-black px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg cursor-help" title="Premiumfunktion">
                    <Lock size={10} /> Premium
                 </div>
            </div>
        )}

        {activeTab === "upload" && (
            <ImageUploader 
                onImageSelected={onImageSelected} 
                isPremium={isPremium} 
                onPremiumClick={onShowUpgrade}
            />
        )}

        {activeTab === "unsplash" && (
            <UnsplashPicker 
                onImageSelected={onImageSelected} 
                isPremium={isPremium} 
                onPremiumClick={onShowUpgrade}
            />
        )}
      </div>
    </div>
  );
}