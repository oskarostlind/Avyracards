"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Loader2, Layers, CreditCard, Minus, Plus, Upload, X, Check, Sparkles } from "lucide-react";
import { CardPreview3D } from "@/components/card-preview-3d";
import { LiveProfileDemo } from "@/components/live-profile-demo"; // Importera demon

// Behåll dina Color-types och konstanter som förut...
type MaterialType = "plastic" | "metal";
type DesignType = "minimal" | "qr";

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  border?: boolean;
}

const PLASTIC_COLORS: ColorOption[] = [
  { id: "black", name: "Matt Black", hex: "#1a1a1a" },
  { id: "white", name: "Matt White", hex: "#f5f5f5", border: true },
  { id: "red", name: "Red", hex: "#dc2626" },
  { id: "blue", name: "Blue", hex: "#2563eb" },
  { id: "green", name: "Green", hex: "#16a34a" },
  { id: "yellow", name: "Yellow", hex: "#ca8a04" },
  { id: "grey", name: "Grey", hex: "#4b5563" },
];

const METAL_COLORS: ColorOption[] = [
  { id: "metal-black", name: "Matte Black", hex: "#171717" },
  { id: "silver", name: "Silver", hex: "#e5e7eb" },
  { id: "gold", name: "Luxury Gold", hex: "#fcd34d" },
  { id: "rosegold", name: "Rose Gold", hex: "#fca5a5" },
];

export default function OrderPage() {
  const [loading, setLoading] = useState(false);
  
  const [material, setMaterial] = useState<MaterialType>("plastic");
  const [design] = useState<DesignType>("minimal"); 
  const [color, setColor] = useState("black");
  const [quantity, setQuantity] = useState(1);
  const [customImage, setCustomImage] = useState<string | null>(null);
  
  // Bundling state
  const [addPremium, setAddPremium] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);
    }
  };

  const clearImage = () => {
    setCustomImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectMaterial = (m: MaterialType) => {
    setMaterial(m);
    setCustomImage(null);
    if (m === "plastic") {
      setColor("black");
    } else {
      setColor("metal-black");
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      
      // Omdirigera till rätt checkout beroende på om Premium valdes
      if (addPremium) {
         window.location.href = "/checkout/premium?bundled=true";
      } else {
         // Har du en gäst-checkout för bara kort? Annars kanske till samma
         // men utan premium-flaggan? Jag sätter en placeholder här:
         window.location.href = "/checkout/guest"; 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cardPrice = material === "metal" ? 499 : 149;
  const customPrintCost = customImage ? 100 : 0; 
  const premiumCost = addPremium ? 299 : 0; 
  const total = ((cardPrice + customPrintCost) * quantity) + premiumCost;
  
  const activeColors = material === "plastic" ? PLASTIC_COLORS : METAL_COLORS;

  return (
    <div className="min-h-screen bg-[#050505] text-white py-6 lg:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* VÄNSTER: Previews */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col gap-6 lg:sticky lg:top-24">
            
            {/* 3D Card */}
            <div className="flex flex-col items-center justify-center min-h-[320px] lg:min-h-[400px] bg-[#0a0a0a] rounded-3xl border border-white/5 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="relative z-10 w-full px-6 flex flex-col items-center">
                    <CardPreview3D 
                        material={material}
                        color={color}
                        design={design}
                        customImage={customImage}
                    />
                    <div className="text-center mt-4 space-y-1 text-gray-500">
                        <p className="text-xs">Dra för att rotera</p>
                    </div>
                </div>
            </div>

            {/* Live Profile Demo (Visas vid Bundling) */}
            {addPremium && (
               <div className="animate-in slide-in-from-bottom-4 duration-500 bg-[#0A0F1C] border border-blue-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-blue-900/10">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                     <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Sparkles size={20}/></div>
                     <div>
                        <h3 className="font-bold text-base text-white">Ingår: Premium Profil</h3>
                        <p className="text-xs text-gray-400">Detta ser folk när de blippar ditt kort</p>
                     </div>
                  </div>
                  
                  {/* Här används din befintliga preview */}
                  <LiveProfileDemo />
               </div>
            )}
        </div>

        {/* HÖGER: Konfigurator */}
        <div className="lg:col-span-5 order-2 lg:order-1 space-y-8 py-2">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2">Designa ditt kort</h1>
            <p className="text-gray-400 text-sm lg:text-base">Skräddarsy ditt NFC-kort för professionellt nätverkande.</p>
          </div>

          {/* 1. Material */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">1. Material</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => selectMaterial("plastic")} className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${material === "plastic" ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/10 hover:border-white/20 text-gray-400"}`}>
                <div className="p-2 bg-white/5 rounded-lg"><Layers size={18} /></div>
                <div className="text-left"><span className="block font-bold text-sm">Standard</span><span className="text-xs opacity-60">PVC Plast</span></div>
                <span className="ml-auto text-xs font-medium bg-white/10 px-2 py-1 rounded">149 kr</span>
              </button>
              <button onClick={() => selectMaterial("metal")} className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${material === "metal" ? "border-blue-500 bg-blue-500/10 text-white" : "border-white/10 hover:border-white/20 text-gray-400"}`}>
                <div className="p-2 bg-white/5 rounded-lg"><CreditCard size={18} /></div>
                <div className="text-left"><span className="block font-bold text-sm">Metal Hybrid</span><span className="text-xs opacity-60">Rostfritt stål</span></div>
                <span className="ml-auto text-xs font-medium bg-white/10 px-2 py-1 rounded">499 kr</span>
              </button>
            </div>
          </div>

          {/* 2. Färg */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">2. Färg</label>
            <div className="flex flex-wrap gap-3">
              {activeColors.map((c) => (
                <button key={c.id} onClick={() => setColor(c.id)} className={`group relative w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${color === c.id ? "border-blue-500 scale-110" : "border-transparent"}`} style={{ backgroundColor: c.hex }} title={c.name}>
                  {c.border && <span className="absolute inset-0 rounded-full border border-black/10"></span>}
                  {color === c.id && <span className={`absolute inset-0 flex items-center justify-center ${c.id === "white" || c.id === "silver" ? "text-black" : "text-white"}`}><Check size={16} strokeWidth={4} /></span>}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Custom Print */}
          {material === "metal" && (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center ml-1"><label className="text-xs font-bold text-gray-500 uppercase tracking-widest">3. Custom Print (+100 kr)</label><span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">NYHET</span></div>
                {!customImage ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-6 text-center cursor-pointer transition-all group">
                        <Upload className="mx-auto mb-2 text-gray-500 group-hover:text-blue-400" size={20} />
                        <p className="text-sm font-medium text-gray-300">Ladda upp logotyp</p>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-white/20 group h-24 w-full">
                        <Image src={customImage} alt="Upload" fill className="object-cover opacity-50" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center gap-4 z-10">
                             <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold">Byt</button>
                             <button onClick={clearImage} className="bg-red-500/20 text-red-400 p-1.5 rounded-lg"><X size={16} /></button>
                        </div>
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
             </div>
          )}

          {/* 4. Bundling Offer */}
          <div className="space-y-3 pt-4">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">4. Uppgradera</label>
             <div 
                onClick={() => setAddPremium(!addPremium)}
                className={`
                    relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 group
                    ${addPremium 
                        ? "border-blue-500 bg-blue-900/10" 
                        : "border-gray-800 bg-gray-900/30 hover:border-gray-700"
                    }
                `}
             >
                <div className="flex justify-between items-start gap-4">
                   <div className="flex gap-3">
                      <div className={`mt-1 h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${addPremium ? "bg-blue-500 border-blue-500" : "border-gray-600 group-hover:border-gray-500"}`}>
                         {addPremium && <Check size={12} className="text-white" />}
                      </div>
                      <div>
                         <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
                            Lägg till Premium (6 mån)
                            <span className="bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">SPARA 37%</span>
                         </h3>
                         <p className="text-xs md:text-sm text-gray-400 mt-1">
                            Lås upp teman, analys och verifierad badge.
                         </p>
                      </div>
                   </div>
                   <div className="text-right shrink-0">
                      <div className="font-bold text-base md:text-lg text-white">299 kr</div>
                      <div className="text-xs text-gray-500 line-through">474 kr</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="h-px bg-white/10 my-6"></div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Totalt</span>
                <span className="text-3xl font-bold tracking-tight">{total} kr</span>
             </div>
                
             <button onClick={handleCheckout} disabled={loading} className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all shadow-lg flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : "Gå till kassan"}
             </button>
             <p className="text-center text-xs text-gray-600">Leverans 2-4 arbetsdagar • Fri frakt över 500 kr</p>
          </div>
        </div>

      </div>
    </div>
  );
}