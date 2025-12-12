"use client";

import { useState } from "react";
import { Loader2, CreditCard, Layers, Minus, Plus } from "lucide-react";

export default function OrderPage() {
  const [loading, setLoading] = useState(false);
  const [material, setMaterial] = useState<"plastic" | "metal">("plastic");
  const [quantity, setQuantity] = useState(1);
  const [color] = useState("black"); 

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material, quantity, color }),
      });

      const data = await response.json();
      if (data.url) window.location.href = data.url; 
    } catch (error) {
      console.error("Fel:", error);
    } finally {
      setLoading(false);
    }
  };

  const pricePerCard = material === "metal" ? 499 : 149;
  const total = pricePerCard * quantity;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* VÄNSTER: Konfigurator */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Beställ ditt kort</h1>

          {/* Materialval */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-4">Välj material</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMaterial("plastic")}
                className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all border-2 ${
                  material === "plastic" 
                    ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm" 
                    : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Layers className={`w-8 h-8 ${material === "plastic" ? "text-blue-600" : "text-gray-400"}`} />
                <div className="text-center">
                  <span className="block font-bold text-lg">Standard</span>
                  <span className="text-sm opacity-80">Plast</span>
                </div>
                <span className="text-sm font-medium bg-white px-2 py-1 rounded-md border border-gray-200 mt-1">149 kr</span>
              </button>
              
              <button
                onClick={() => setMaterial("metal")}
                className={`p-6 rounded-2xl flex flex-col items-center gap-3 transition-all border-2 ${
                  material === "metal" 
                    ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm" 
                    : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CreditCard className={`w-8 h-8 ${material === "metal" ? "text-blue-600" : "text-gray-400"}`} />
                <div className="text-center">
                  <span className="block font-bold text-lg">Premium</span>
                  <span className="text-sm opacity-80">Metall</span>
                </div>
                <span className="text-sm font-medium bg-white px-2 py-1 rounded-md border border-gray-200 mt-1">499 kr</span>
              </button>
            </div>
          </div>

          {/* Antal */}
          <div className="mb-8">
             <label className="block text-sm font-semibold text-gray-900 mb-4">Antal kort</label>
             <div className="flex items-center gap-6 bg-gray-50 w-fit p-2 rounded-xl border border-gray-200">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                ><Minus size={18} /></button>
                <span className="text-xl font-bold w-8 text-center tabular-nums text-gray-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                ><Plus size={18} /></button>
             </div>
          </div>

          {/* Summering & Knapp */}
          <div className="border-t border-gray-100 pt-8 mt-auto">
            <div className="flex justify-between items-end mb-6">
              <span className="text-gray-500 font-medium">Totalt att betala</span>
              <span className="text-4xl font-bold text-gray-900 tracking-tight">{total} kr</span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? "Laddar..." : "Gå till kassan"}
            </button>
          </div>
        </div>

        {/* HÖGER: Preview */}
        <div className="hidden md:flex items-center justify-center bg-gray-100 rounded-3xl relative overflow-hidden">
           {/* Bakgrundseffekt */}
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-400 via-gray-100 to-transparent"></div>
           
           <div className={`
              w-[340px] h-[214px] rounded-2xl shadow-2xl relative transition-all duration-500 transform hover:scale-105 hover:rotate-1
              ${material === "metal" 
                ? "bg-gradient-to-br from-gray-800 via-gray-900 to-black text-gray-100 border border-gray-700" 
                : "bg-white text-gray-900 border border-gray-200"}
           `}>
              {/* Kortinnehåll */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                 <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-lg ${material === 'metal' ? 'bg-white/10' : 'bg-black/5'}`}></div>
                    <div className="opacity-40 text-xs font-mono tracking-widest">NFC</div>
                 </div>
                 <div>
                    <div className="text-xl font-bold tracking-wide mb-1">Ditt Namn</div>
                    <div className="text-xs opacity-60 uppercase tracking-wider">SocialCard {material}</div>
                 </div>
              </div>
              
              {/* Metall-glans */}
              {material === "metal" && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 rounded-2xl pointer-events-none z-20"></div>
              )}
           </div>
           
           <p className="absolute bottom-12 text-gray-400 text-sm font-medium">Live Preview</p>
        </div>

      </div>
    </div>
  );
}