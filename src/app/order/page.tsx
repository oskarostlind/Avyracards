"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Loader2, Layers, CreditCard, Minus, Plus, Upload, X, Check, Sparkles, Smartphone } from "lucide-react";
import { CardPreview3D } from "@/components/card-preview-3d";

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
      // Simulera API anrop och redirect
      await new Promise(r => setTimeout(r, 1500));
      // Här skulle vi skicka med 'addPremium' i bodyn till API:et
      window.location.href = "/checkout/success"; 
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prisberäkning
  const cardPrice = material === "metal" ? 499 : 149;
  const customPrintCost = customImage ? 100 : 0; 
  const premiumCost = addPremium ? 299 : 0; // Exempel: 6 månader för 299 (Ord. 474kr)
  
  const total = ((cardPrice + customPrintCost) * quantity) + premiumCost;
  
  const activeColors = material === "plastic" ? PLASTIC_COLORS : METAL_COLORS;

  return (
    <div className="min-h-screen bg-[#050505] text-white py-6 lg:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        
        {/* VÄNSTER: Preview (Card + Digital Profile) */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col gap-6">
            
            {/* 3D Card Preview */}
            <div className="flex flex-col items-center justify-center min-h-[320px] lg:min-h-[400px] bg-[#0a0a0a] rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="relative z-10 w-full px-6 flex flex-col items-center">
                    <CardPreview3D 
                        material={material}
                        color={color}
                        design={design}
                        customImage={customImage}
                    />
                    <div className="text-center mt-4 space-y-1 animate-in fade-in duration-700">
                        <p className="text-sm font-medium text-gray-400">Dra för att rotera</p>
                    </div>
                </div>
            </div>

            {/* Live Digital Preview (Visas om man väljer Premium) */}
            {addPremium && (
               <div className="animate-in slide-in-from-bottom-4 duration-500 bg-[#0A0F1C] border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Smartphone size={20}/></div>
                     <div>
                        <h3 className="font-bold text-sm">Ingår: Premium Profil</h3>
                        <p className="text-xs text-gray-400">Detta ser folk när de blippar ditt kort</p>
                     </div>
                  </div>
                  
                  {/* Mockup av profil */}
                  <div className="flex gap-4 items-center bg-black/40 p-4 rounded-xl border border-white/5">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0"></div>
                     <div className="space-y-2 w-full">
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="flex gap-2">
                           <div className="h-8 w-8 bg-white/5 rounded-lg"></div>
                           <div className="h-8 w-8 bg-white/5 rounded-lg"></div>
                           <div className="h-8 w-8 bg-white/5 rounded-lg"></div>
                        </div>
                     </div>
                     <div className="ml-auto bg-green-500/10 text-green-400 text-[10px] px-2 py-1 rounded font-bold">VERIFIERAD</div>
                  </div>
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
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">1. Material</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => selectMaterial("plastic")}
                className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
                  material === "plastic" 
                    ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(37,99,235,0.15)]" 
                    : "border-white/10 hover:border-white/20 text-gray-400"
                }`}
              >
                <div className="p-2 bg-white/5 rounded-lg"><Layers size={18} /></div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Standard</span>
                  <span className="text-xs opacity-60">PVC Plast</span>
                </div>
                <span className="ml-auto text-xs font-medium bg-white/10 px-2 py-1 rounded">149 kr</span>
              </button>
              
              <button
                onClick={() => selectMaterial("metal")}
                className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
                  material === "metal" 
                    ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(37,99,235,0.15)]" 
                    : "border-white/10 hover:border-white/20 text-gray-400"
                }`}
              >
                <div className="p-2 bg-white/5 rounded-lg"><CreditCard size={18} /></div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Metal Hybrid</span>
                  <span className="text-xs opacity-60">Rostfritt stål</span>
                </div>
                <span className="ml-auto text-xs font-medium bg-white/10 px-2 py-1 rounded">499 kr</span>
              </button>
            </div>
          </div>

          {/* 2. Färg */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">2. Färg</label>
            <div className="flex flex-wrap gap-3">
              {activeColors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`group relative w-12 h-12 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${
                    color === c.id ? "border-blue-500 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {c.border && <span className="absolute inset-0 rounded-full border border-black/10"></span>}
                  {color === c.id && (
                    <span className={`absolute inset-0 flex items-center justify-center ${c.id === "white" || c.id === "silver" ? "text-black" : "text-white"}`}>
                      <Check size={16} strokeWidth={4} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Custom Print (Endast Metall) */}
          {material === "metal" && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">3. Custom Print (+100 kr)</label>
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">NYHET</span>
                </div>
                
                {!customImage ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-8 text-center cursor-pointer transition-all group"
                    >
                        <Upload className="mx-auto mb-3 text-gray-500 group-hover:text-blue-400" size={24} />
                        <p className="text-sm font-medium text-gray-300">Ladda upp logotyp</p>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-white/20 group h-32 w-full">
                        <Image src={customImage} alt="Upload" fill className="object-cover opacity-50" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center gap-4 z-10">
                             <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">Byt bild</button>
                             <button onClick={clearImage} className="bg-red-500/20 text-red-400 p-2 rounded-lg"><X size={20} /></button>
                        </div>
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
             </div>
          )}

          {/* 4. Bundling Offer */}
          <div 
            onClick={() => setAddPremium(!addPremium)}
            className={`
                relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300
                ${addPremium 
                    ? "border-blue-500 bg-blue-500/5" 
                    : "border-gray-800 bg-gray-900/30 hover:border-gray-700"
                }
            `}
          >
             <div className="flex justify-between items-start">
                <div className="flex gap-3">
                   <div className={`mt-1 p-1 rounded-full border ${addPremium ? "bg-blue-500 border-blue-500" : "border-gray-600"}`}>
                      {addPremium && <Check size={12} className="text-white" />}
                   </div>
                   <div>
                      <h3 className="font-bold flex items-center gap-2">
                         Lägg till Premium (6 mån)
                         <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">SPARA 37%</span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 max-w-xs">
                         Få tillgång till analysverktyg, inga annonser och prioriterad support.
                      </p>
                   </div>
                </div>
                <div className="text-right">
                   <div className="font-bold text-lg">299 kr</div>
                   <div className="text-xs text-gray-500 line-through">474 kr</div>
                </div>
             </div>
          </div>

          <div className="h-px bg-white/10 my-6"></div>

          {/* Summary & Checkout */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Totalt</span>
                <span className="text-3xl font-bold tracking-tight">{total} kr</span>
             </div>
                
             <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all shadow-lg flex items-center justify-center gap-2"
             >
                {loading ? <Loader2 className="animate-spin" /> : "Gå till kassan"}
             </button>
             
             <p className="text-center text-xs text-gray-600">
                Leverans 2-4 arbetsdagar • Fri frakt över 500 kr
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}