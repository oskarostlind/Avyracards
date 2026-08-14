"use client";

import { Search, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useT } from "@/i18n/client";

interface UnsplashPickerProps {
  onImageSelected: (url: string) => void;
  isPremium: boolean;
  onPremiumClick: () => void;
}

type UnsplashPhoto = {
  id: string;
  urls: {
    regular: string;
    full?: string;
  };
  alt_description: string;
};

export function UnsplashPicker({ onImageSelected, isPremium, onPremiumClick }: UnsplashPickerProps) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Premium-check
    if (!isPremium) {
      onPremiumClick();
      return;
    }

    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(t("themes.media.fetchFailed"));
      
      const data = await res.json();
      setPhotos(data.results || []);
    } catch (error) {
      console.error("Failed to search unsplash", error);
      setError(t("themes.media.searchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (url: string) => {
    if (!isPremium) {
      onPremiumClick();
      return;
    }
    // Vi optimerar URL för kvalitet
    // Tar bort ev befintliga params och sätter våra egna
    const baseUrl = url.split('?')[0];
    const highResUrl = `${baseUrl}?q=80&w=1600&auto=format&fit=crop`;
        
    onImageSelected(highResUrl);
  };

  return (
    <div className="space-y-4">
      {/* Sökruta */}
      <form onSubmit={handleSearch} className="relative">
        <input 
          type="text" 
          placeholder={t("themes.media.searchPlaceholder")} 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Om ej premium, trigga modal vid klick
          onClick={() => !isPremium && onPremiumClick()}
          className="w-full bg-slate-900 border border-nordic-highlight/40 rounded-xl pl-10 pr-10 py-3 text-sm text-nordic-secondary focus:border-purple-500 outline-none transition-all placeholder:text-slate-600"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        
        {loading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-purple-500" />
            </div>
        ) : (
            <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                disabled={!query.trim()}
            >
                <Search size={14} />
            </button>
        )}
      </form>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs px-1">
            <AlertCircle size={12} /> {error}
        </div>
      )}

      {/* Resultat Grid */}
      <div className="grid grid-cols-2 gap-2 h-56 overflow-y-auto custom-scrollbar pr-1">
         {photos.map((photo) => (
            <button
                key={photo.id}
                onClick={() => handleSelect(photo.urls.regular)}
                className="relative aspect-video rounded-lg overflow-hidden group border border-transparent hover:border-purple-500 transition-all bg-slate-800"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={photo.urls.regular} 
                    alt={photo.alt_description || "Unsplash"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Overlay vid hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
         ))}
         
         {hasSearched && photos.length === 0 && !loading && (
             <div className="col-span-2 text-center py-8 text-nordic-highlight text-xs">
                 Inga bilder hittades.
             </div>
         )}

         {!hasSearched && (
             <div className="col-span-2 text-center py-8 text-nordic-highlight text-xs opacity-50">
                 Sök för att visa bilder...
             </div>
         )}
      </div>
      
      <p className="text-[10px] text-center text-slate-500 mt-2">
        Bilder från <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-400">Unsplash</a>
      </p>
    </div>
  );
}