"use client";

import { useState } from "react";
import { Loader2, CreditCard, Layers, Minus, Plus, Check, QrCode, Smartphone } from "lucide-react";

type MaterialType = "plastic" | "metal";
type DesignType = "minimal" | "qr";
type ColorType = "black" | "white" | "gold" | "silver";

export default function OrderPage() {
  const [loading, setLoading] = useState(false);
  
  // State för konfiguratorn
  const [material, setMaterial] = useState<MaterialType>("plastic");
  const [design, setDesign] = useState<DesignType>("minimal");
  const [color, setColor] = useState<ColorType>("black");
  const [quantity, setQuantity] = useState(1);

  // Prislista
  const pricePerCard = material === "metal" ? 499 : 149;
  const total = pricePerCard * quantity;

  // Tillgängliga färger baserat på material
  const availableColors = material === "metal" 
    ? [
        { id: "black", name: "Matte Black", bg: "bg-gray-900" },
        { id: "gold", name: "Luxury Gold", bg: "bg-yellow-600" },
        { id: "silver", name: "Sterling Silver", bg: "bg-gray-300" }
      ]
    : [
        { id: "black", name: "Midnight Black", bg: "bg-gray-900" },
        { id: "white", name: "Clean White", bg: "bg-gray-100 border border-gray-300" }
      ];

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
          design 
        }),
      });

      const data = await response.json();
      if (data.url) window.location.href = data.url; 
    } catch (error) {
      console.error("Fel vid checkout:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* VÄNSTER: Konfigurator */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Designa ditt kort</h1>
            <p className="text-gray-500">Välj material och utseende som passar ditt varumärke.</p>
          </div>

          {/* 1. Materialval */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 block">1. Välj Material</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setMaterial("plastic"); setColor("black"); }}
                className={`p-4 rounded-2xl flex items-center gap-4 border-2 transition-all ${
                  material === "plastic" 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${material === "plastic" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                  <Layers size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-gray-900">Standard</span>
                  <span className="text-xs text-gray-500">Hållbar PVC-plast</span>
                </div>
                <span className="ml-auto text-sm font-bold">149 kr</span>
              </button>
              
              <button
                onClick={() => { setMaterial("metal"); setColor("black"); }}
                className={`p-4 rounded-2xl flex items-center gap-4 border-2 transition-all ${
                  material === "metal" 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${material === "metal" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-gray-900">Metal Hybrid</span>
                  <span className="text-xs text-gray-500">Premium rostfritt stål</span>
                </div>
                <span className="ml-auto text-sm font-bold">499 kr</span>
              </button>
            </div>
          </div>

          {/* 2. Designval */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 block">2. Välj Layout</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDesign("minimal")}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                  design === "minimal" ? "border-black bg-gray-50" : "border-gray-100"
                }`}
              >
                <Smartphone className="mb-2" />
                <span className="text-sm font-semibold">Minimal</span>
              </button>
              <button
                onClick={() => setDesign("qr")}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                  design === "qr" ? "border-black bg-gray-50" : "border-gray-100"
                }`}
              >
                <QrCode className="mb-2" />
                <span className="text-sm font-semibold">QR Kod</span>
              </button>
            </div>
          </div>

          {/* 3. Färgval */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <label className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 block">3. Välj Finish</label>
            <div className="flex gap-4">
              {availableColors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id as ColorType)}
                  className={`group relative w-16 h-16 rounded-full ${c.bg} shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600`}
                >
                  {color === c.id && (
                    <span className={`absolute inset-0 flex items-center justify-center ${c.id === "white" || c.id === "silver" ? "text-black" : "text-white"}`}>
                      <Check size={24} strokeWidth={3} />
                    </span>
                  )}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500 w-max opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Antal & Köp */}
          <div className="flex items-center justify-between pt-4">
             <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-gray-200">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100 rounded-lg"><Minus size={16}/></button>
                <span className="font-bold w-4 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-gray-100 rounded-lg"><Plus size={16}/></button>
             </div>
             <div className="text-right">
               <p className="text-sm text-gray-500">Totalt</p>
               <p className="text-3xl font-bold">{total} kr</p>
             </div>
          </div>
            
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Gå till kassan"}
          </button>
        </div>

        {/* HÖGER: Live Preview */}
        <div className="sticky top-12 h-fit">
           <div className="relative aspect-[1.586/1] w-full max-w-lg mx-auto rounded-3xl shadow-2xl transition-all duration-500 perspective-1000">
             
             {/* Kortets bakgrund & Materialeffekt */}
             <div className={`
                absolute inset-0 rounded-3xl overflow-hidden transition-colors duration-500
                ${material === "metal" && color === "black" ? "bg-zinc-900" : ""}
                ${material === "metal" && color === "gold" ? "bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700" : ""}
                ${material === "metal" && color === "silver" ? "bg-gradient-to-br from-gray-300 via-gray-100 to-gray-400" : ""}
                ${material === "plastic" && color === "black" ? "bg-gray-900" : ""}
                ${material === "plastic" && color === "white" ? "bg-white border border-gray-200" : ""}
             `}>
                
                {/* Metall-glans overlay */}
                {material === "metal" && (
                   <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 pointer-events-none" />
                )}

                {/* Innehåll */}
                <div className={`relative h-full p-10 flex flex-col justify-between ${
                   color === "white" || color === "silver" ? "text-black" : "text-white"
                }`}>
                   <div className="flex justify-between items-start">
                      {/* Logo / Ikon */}
                      <div className="w-12 h-12 rounded-xl bg-current opacity-10 flex items-center justify-center">
                        <Layers size={24} className="opacity-50"/>
                      </div>
                      <div className="opacity-50 text-xs font-mono tracking-[0.2em] uppercase">
                        {material}
                      </div>
                   </div>

                   <div className="flex items-end justify-between">
                      <div>
                         <div className="text-2xl font-bold tracking-wide">Ditt Namn</div>
                         <div className="text-sm opacity-60 mt-1">SocialCard</div>
                      </div>

                      {/* QR Kod om vald */}
                      {design === "qr" && (
                        <div className="bg-white p-2 rounded-lg">
                           <div className="w-12 h-12 bg-black opacity-10"></div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
           </div>
           
           <p className="text-center mt-8 text-sm text-gray-400 font-medium">
             Förhandsgranskning. Du kopplar din profil efter leverans.
           </p>
        </div>

      </div>
    </div>
  );
}