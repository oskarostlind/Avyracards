"use client";

import { UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useT } from "@/i18n/client";

interface ImageUploaderProps {
  onImageSelected: (url: string) => void;
  isPremium: boolean;
  onPremiumClick: () => void;
}

export function ImageUploader({ onImageSelected, isPremium, onPremiumClick }: ImageUploaderProps) {
  const t = useT();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // 1. Premium-check
    if (!isPremium) {
      onPremiumClick();
      return;
    }

    // 2. Validering (Max 4MB för bakgrunder är rimligt)
    if (file.size > 4 * 1024 * 1024) {
      setError(t("themes.media.tooLarge"));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(t("themes.media.onlyImages"));
      return;
    }

    setIsUploading(true);

    try {
      // 3. Ladda upp mot din API-route
      // Vi använder encodeURIComponent för att hantera mellanslag/tecken i filnamnet
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) {
        throw new Error("Uppladdningen misslyckades");
      }

      const blob = await response.json();

      // 4. Skicka URL:en till editorn
      onImageSelected(blob.url);

    } catch (err) {
      console.error("Upload error:", err);
      setError(t("themes.media.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isPremium) return;
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`relative rounded-xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer group
        ${isDragging 
          ? "border-purple-500 bg-purple-500/10" 
          : "border-nordic-highlight/30 bg-slate-900/50 hover:border-nordic-highlight hover:bg-slate-900"
        }
        ${error ? "border-red-500/50 bg-red-500/5" : ""}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !isPremium ? onPremiumClick() : fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-2 animate-in fade-in">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          <p className="text-xs text-nordic-highlight">Laddar upp bild...</p>
        </div>
      ) : (
        <>
          <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-purple-500 text-white' : 'bg-slate-800 text-nordic-highlight group-hover:text-white'}`}>
            <UploadCloud size={24} />
          </div>
          
          {error ? (
             <div className="flex items-center gap-2 text-red-400 mb-1">
                <AlertCircle size={14} />
                <span className="text-sm font-medium">{error}</span>
             </div>
          ) : (
             <p className="text-sm font-medium text-nordic-secondary mb-1">
               {isPremium ? "Klicka eller dra bild hit" : "Ladda upp egen bild (Premium)"}
             </p>
          )}

          <p className="text-xs text-nordic-highlight">
            JPG, PNG, WebP. Max 4MB.
          </p>
        </>
      )}
    </div>
  );
}