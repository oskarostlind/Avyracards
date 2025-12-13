"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Loader2, Layers, CreditCard, Minus, Plus, Upload, X, Check } from "lucide-react";
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
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          material, 
          quantity, 
          color,
          design,
          hasCustomPrint: !!customImage 
        }),
      });

      const data = await response.json();
      if (data.url) window.location.href = data.url; 
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const pricePerCard = material === "metal" ? 499 : 149;
  const customPrintCost = customImage ? 100 : 0; 
  const total = (pricePerCard + customPrintCost) * quantity;
  
  const activeColors = material === "plastic" ? PLASTIC_COLORS : METAL_COLORS;

  return (
    <div className="min-h-screen bg-[#050505] text-white py-6 lg:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        
        {/* VÄNSTER: Preview (Sticky endast på desktop) */}
        <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="flex flex-col items-center justify-center min-h-[320px] lg:min-h-[500px] lg:sticky lg:top-24 bg-[#0a0a0a] rounded-3xl border border-white/5 relative overflow-hidden group">
                {/* Background effects */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>

                <div className="relative z-10 w-full px-6 flex flex-col items-center">
                    <CardPreview3D 
                        material={material}
                        color={color}
                        design={design}
                        customImage={customImage}
                    />
                    
                    <div className="text-center mt-4 lg:mt-8 space-y-1 animate-in fade-in duration-700">
                        <p className="text-sm font-medium text-gray-400">Dra för att rotera</p>
                        <p className="text-xs text-gray-600 block lg:hidden">Touch aktiverat</p>
                    </div>
                </div>
            </div>
        </div>

        {/* HÖGER: Konfigurator */}
        <div className="lg:col-span-5 order-2 lg:order-1 space-y-8 lg:space-y-10 py-2">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2">Designa ditt kort</h1>
            <p className="text-gray-400 text-sm lg:text-base">Skräddarsy ditt NFC-kort för professionellt nätverkande.</p>
          </div>

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
                <div className="p-2 bg-white/5 rounded-lg">
                  <Layers size={18} />
                </div>
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
                <div className="p-2 bg-white/5 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Metal Hybrid</span>
                  <span className="text-xs opacity-60">Rostfritt stål</span>
                </div>
                <span className="ml-auto text-xs font-medium bg-white/10 px-2 py-1 rounded">499 kr</span>
              </button>
            </div>
          </div>

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
            <p className="text-xs text-gray-500">Vald färg: <span className="text-white font-medium">{activeColors.find(c => c.id === color)?.name}</span></p>
          </div>

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
                        <p className="text-sm font-medium text-gray-300">Ladda upp logotyp / design</p>
                        <p className="text-xs text-gray-600 mt-1">PNG eller JPG. Vi centrerar den automatiskt.</p>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-white/20 group h-32 w-full">
                        <Image 
                          src={customImage} 
                          alt="Upload" 
                          fill
                          className="object-cover opacity-50"
                          unoptimized 
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-4 z-10">
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200"
                             >
                                Byt bild
                             </button>
                             <button 
                                onClick={clearImage}
                                className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/40"
                             >
                                <X size={20} />
                             </button>
                        </div>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                />
             </div>
          )}

          <div className="h-px bg-white/10 my-6 lg:my-8"></div>

          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Antal</span>
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="hover:text-white text-gray-400"><Minus size={16}/></button>
                    <span className="font-bold w-4 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="hover:text-white text-gray-400"><Plus size={16}/></button>
                </div>
             </div>

             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Att betala</span>
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