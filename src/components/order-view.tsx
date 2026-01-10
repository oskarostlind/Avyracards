"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Loader2, Layers, CreditCard, Upload, X, Check, Sparkles } from "lucide-react";
import { CardPreview3D } from "@/components/card-preview-3d"; 
import { LiveProfileDemo } from "@/components/live-profile-demo";

// --- Types ---
type MaterialType = "plastic" | "metal";
type DesignType = "minimal" | "qr";
type PremiumOption = "none" | "1mo" | "6mo";

export interface DbVariant {
  id: string;
  name: string;
  price: number; 
  compareAtPrice: number | null; 
  colorCode: string | null;
  type: string;
}

interface OrderViewProps {
  standardVariants: DbVariant[];
  metalVariants: DbVariant[];
  bundleVariant: DbVariant | null;
  isPremium: boolean;
}

export default function OrderViewWrapper(props: OrderViewProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#050505]"><Loader2 className="animate-spin text-white" /></div>}>
      <OrderViewContent {...props} />
    </Suspense>
  );
}

function OrderViewContent({ standardVariants, metalVariants, bundleVariant, isPremium }: OrderViewProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  const defaultStandardColor = standardVariants[0]?.colorCode || "#1a1a1a";
  const defaultMetalColor = metalVariants[0]?.colorCode || "#171717";

  const [material, setMaterial] = useState<MaterialType>("plastic");
  const [design] = useState<DesignType>("minimal"); 
  const [colorCode, setColorCode] = useState<string>(defaultStandardColor);
  const [customImage, setCustomImage] = useState<string | null>(null);
  
  // Default: Om bundle, välj 1mo. Om isPremium, tvinga none.
  const [premiumOption, setPremiumOption] = useState<PremiumOption>("none");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    const isBundle = searchParams.get("bundle") === "pro-bundle";
    // Om bundle-länk och användaren INTE redan har premium -> Välj gratismånaden
    if (isBundle && !isPremium) {
      setPremiumOption("1mo"); 
      setMaterial("plastic");
    }
  }, [searchParams, isPremium]);

  // --- Helpers ---
  const findSelectedVariant = () => {
    const variants = material === "plastic" ? standardVariants : metalVariants;
    return variants.find(v => v.colorCode === colorCode) || variants[0];
  };

  const selectedVariant = findSelectedVariant();
  const quantity = 1;

  const getDisplayPriceForMaterial = (m: MaterialType) => {
      const variants = m === "plastic" ? standardVariants : metalVariants;
      if (variants.length === 0) return { price: 0, compareAt: null };

      if (material === m) {
          const variant = variants.find(v => v.colorCode === colorCode);
          const active = variant || variants[0];
          return { price: active.price, compareAt: active.compareAtPrice };
      }
      
      const cheapest = variants.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      return { price: cheapest.price, compareAt: cheapest.compareAtPrice };
  };

  const standardDisplay = getDisplayPriceForMaterial("plastic");
  const metalDisplay = getDisplayPriceForMaterial("metal");

  // --- Handlers ---
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
    if (m === "plastic") {
      setCustomImage(null);
      setColorCode(defaultStandardColor);
    } else {
      setColorCode(defaultMetalColor);
    }
  };

  const handleCheckout = async () => {
      if (!selectedVariant) return alert("Ingen variant vald.");
      
      try {
        setLoading(true);
        
        const items = [];
        
        items.push({
            variantId: selectedVariant.id,
            quantity: quantity,
            color: selectedVariant.name,
            design: design,
            material: material,
            customImage: customImage ? "uploaded-image-reference" : null 
        });

        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, premiumOption }) 
        });

        if(!response.ok) throw new Error("Checkout failed");
        const data = await response.json();
        if (data.url) window.location.href = data.url;
      
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
  };

  // --- Calculations ---
  const cardPrice = selectedVariant ? (selectedVariant.price / 100) : 0;
  const compareAt = selectedVariant?.compareAtPrice ? (selectedVariant.compareAtPrice / 100) : null;
  const customPrintCost = (material === "metal" && customImage) ? 100 : 0; 

  // Premium Costs Logic
  let premiumCost = 0;
  
  if (premiumOption === "1mo") {
    premiumCost = 0; // GRATIS NU (Var 100)
  } else if (premiumOption === "6mo") {
    premiumCost = 299;
  }

  const total = ((cardPrice + customPrintCost) * quantity) + premiumCost;
  const activeVariants = material === "plastic" ? standardVariants : metalVariants;
  
  // Savings calculation
  // Om 1mo är vald, sparar man värdet av en månad (t.ex. 69kr) eller bara ser det som en bonus.
  // Vi kan räkna "ordinarie" pris som kort + eventuell custom print + värdet av premium.
  const premiumValue = premiumOption === "1mo" ? 69 : (premiumOption === "6mo" ? 474 : 0);
  const totalOriginalPrice = (compareAt || cardPrice) + customPrintCost + premiumValue;
  
  // Total besparing (om det finns rabatter på kortet ELLER premium)
  const savings = Math.round(totalOriginalPrice - total);
  const hasSavings = savings > 0;

  return (
    <div className="min-h-screen bg-[#050505] text-nordic-secondary py-6 lg:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* LEFT: PREVIEWS */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="flex flex-col items-center justify-center min-h-[400px] lg:min-h-[500px]">
                <CardPreview3D material={material} color={colorCode} design={design} customImage={customImage} />
                {/*<div className="text-center mt-4 space-y-1 text-nordic-highlight"><p className="text-xs">Dra för att rotera</p></div>*/}
            </div>

            {(premiumOption !== "none" || !isPremium) && (
               <div className="animate-in slide-in-from-bottom-4 duration-500 bg-[#0A0F1C] border border-blue-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-blue-900/10">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Sparkles size={20}/></div>
                      <div>
                        <h3 className="font-bold text-base text-nordic-secondary">
                            {isPremium ? "Du har Premium Profil" : "Ingår: Premium Profil"}
                        </h3>
                        <p className="text-xs text-nordic-highlight">Detta ser folk när de blippar ditt kort</p>
                      </div>
                  </div>
                  <LiveProfileDemo />
               </div>
            )}
        </div>

        {/* RIGHT: CONFIGURATOR */}
        <div className="lg:col-span-5 order-2 lg:order-1 space-y-8 py-2">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-nordic-secondary mb-2">Designa ditt kort</h1>
            <p className="text-nordic-highlight text-sm lg:text-base">Skräddarsy ditt NFC-kort för professionellt nätverkande.</p>
          </div>

          {/* 1. Material */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-nordic-highlight uppercase tracking-widest ml-1">1. Material</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => selectMaterial("plastic")} className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${material === "plastic" ? "border-blue-500 bg-blue-500/10 text-nordic-secondary" : "border-white/10 hover:border-white/20 text-nordic-highlight"}`}>
                <div className="p-2 bg-white/5 rounded-lg"><Layers size={18} /></div>
                <div className="text-left"><span className="block font-bold text-sm">Standard</span><span className="text-xs opacity-60">PVC Plast</span></div>
                <div className="ml-auto text-right">
                    {standardDisplay.compareAt && standardDisplay.compareAt > standardDisplay.price && (
                        <div className="text-[10px] text-nordic-highlight line-through">{(standardDisplay.compareAt / 100).toFixed(0)} kr</div>
                    )}
                    <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded block">
                        {(standardDisplay.price / 100).toFixed(0)} kr
                    </span>
                </div>
              </button>

              <button onClick={() => selectMaterial("metal")} className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${material === "metal" ? "border-blue-500 bg-blue-500/10 text-nordic-secondary" : "border-white/10 hover:border-white/20 text-nordic-highlight"}`}>
                <div className="p-2 bg-white/5 rounded-lg"><CreditCard size={18} /></div>
                <div className="text-left"><span className="block font-bold text-sm">Metal Hybrid</span><span className="text-xs opacity-60">Rostfritt stål</span></div>
                 <div className="ml-auto text-right">
                    {metalDisplay.compareAt && metalDisplay.compareAt > metalDisplay.price && (
                        <div className="text-[10px] text-nordic-highlight line-through">{(metalDisplay.compareAt / 100).toFixed(0)} kr</div>
                    )}
                    <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded block">
                        {(metalDisplay.price / 100).toFixed(0)} kr
                    </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Color */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-nordic-highlight uppercase tracking-widest ml-1">2. Färg</label>
            <div className="flex flex-wrap gap-3">
              {activeVariants.map((variant) => {
                const isSelected = colorCode === variant.colorCode;
                const isWhite = variant.colorCode?.toLowerCase() === "#ffffff" || variant.colorCode?.toLowerCase() === "#f5f5f5";
                return (
                    <button 
                        key={variant.id} 
                        onClick={() => setColorCode(variant.colorCode || "")} 
                        className={`group relative w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${isSelected ? "border-blue-500 scale-110" : "border-transparent"}`} 
                        style={{ backgroundColor: variant.colorCode || "#000" }} 
                        title={variant.name}
                    >
                        {isWhite && <span className="absolute inset-0 rounded-full border border-black/10"></span>}
                        {isSelected && <span className={`absolute inset-0 flex items-center justify-center ${isWhite ? "text-nordic-secondary" : "text-nordic-secondary"}`}><Check size={16} strokeWidth={4} /></span>}
                    </button>
                );
              })}
            </div>
          </div>

          {/* 3. Custom Print (Metal Only) */}
           {material === "metal" && (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center ml-1"><label className="text-xs font-bold text-nordic-highlight uppercase tracking-widest">3. Custom Print (+100 kr)</label><span className="text-[10px] bg-blue-500 text-nordic-secondary px-2 py-0.5 rounded-full">POPULÄRT</span></div>
                {!customImage ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-6 text-center cursor-pointer transition-all group">
                        <Upload className="mx-auto mb-2 text-nordic-highlight group-hover:text-blue-400" size={20} />
                        <p className="text-sm font-medium text-gray-300">Ladda upp logotyp</p>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-white/20 group h-24 w-full">
                        <Image src={customImage} alt="Upload" fill className="object-cover opacity-50" unoptimized />
                        <div className="absolute inset-0 flex items-center justify-center gap-4 z-10">
                             <button onClick={() => fileInputRef.current?.click()} className="bg-nordic-secondary text-nordic-primary px-3 py-1.5 rounded-lg text-xs font-bold">Byt</button>
                             <button onClick={clearImage} className="bg-red-500/20 text-red-400 p-1.5 rounded-lg"><X size={16} /></button>
                        </div>
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
             </div>
          )}

           {/* 4. PREMIUM SELECTION - Visas om ej premium */}
           {!isPremium && bundleVariant && (
            <div className="space-y-3 pt-4">
                <label className="text-xs font-bold text-nordic-highlight uppercase tracking-widest ml-1">4. Välj Nivå</label>
                
                <div className="space-y-3">
                    {/* Option 1: Basic */}
                    <div 
                        onClick={() => setPremiumOption("none")}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${premiumOption === "none" ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${premiumOption === "none" ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                                {premiumOption === "none" && <Check size={12} className="text-white" />}
                            </div>
                            <span className="font-medium text-sm">Enbart kort</span>
                            <span className="ml-auto text-sm font-bold text-nordic-highlight">0 kr</span>
                        </div>
                    </div>

                    {/* Option 2: 1 Month FREE */}
                    <div 
                        onClick={() => setPremiumOption("1mo")}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${premiumOption === "1mo" ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${premiumOption === "1mo" ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                                {premiumOption === "1mo" && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm flex items-center gap-2">
                                    Startpaket + 1 mån Premium
                                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full">GRATIS</span>
                                </span>
                                <span className="text-xs text-nordic-highlight">Prova på utan kostnad</span>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="block font-bold text-sm">0 kr</span>
                                <span className="text-xs text-nordic-highlight line-through">69 kr</span>
                            </div>
                        </div>
                    </div>

                    {/* Option 3: Pro Bundle */}
                    <div 
                        onClick={() => setPremiumOption("6mo")}
                        className={`relative p-4 rounded-xl border cursor-pointer transition-all ${premiumOption === "6mo" ? "border-green-500 bg-green-500/10" : "border-white/10 hover:border-white/20"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${premiumOption === "6mo" ? "border-green-500 bg-green-500" : "border-gray-600"}`}>
                                {premiumOption === "6mo" && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm flex items-center gap-2">
                                    Pro (6 månader Premium)
                                    <span className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded-full">SPARA 37%</span>
                                </span>
                                <span className="text-xs text-nordic-highlight">Långsiktig satsning</span>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="block font-bold text-sm">299 kr</span>
                                <span className="text-xs text-nordic-highlight line-through">474 kr</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
           )}

          <div className="h-px bg-white/10 my-6"></div>

          {/* TOTAL */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-nordic-highlight">Totalt</span>
                <div className="text-right">
                    {hasSavings && (
                         <span className="text-sm text-nordic-highlight line-through mr-2">
                            {totalOriginalPrice} kr
                         </span>
                    )}
                    <span className="text-3xl font-bold tracking-tight">{total} kr</span>
                </div>
             </div>

             {hasSavings && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-center text-sm font-bold">
                    🎉 Du sparar {savings} kr!
                </div>
             )}
                
             <button onClick={handleCheckout} disabled={loading} className="w-full bg-nordic-secondary text-nordic-primary py-4 rounded-xl font-bold text-lg hover:bg-nordic-support transition-all shadow-lg flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : "Gå till kassan"}
             </button>
             <p className="text-center text-xs text-gray-600">Leverans 2-4 arbetsdagar • Fri frakt över 500 kr</p>
          </div>
        </div>

      </div>
    </div>
  );
}