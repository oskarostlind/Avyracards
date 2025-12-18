"use client";

import { useRef, useState, CSSProperties } from "react";
import { Layers, QrCode, Wifi, RotateCw } from "lucide-react";
import ReactCardFlip from 'react-card-flip';

interface CardPreview3DProps {
  material: "plastic" | "metal";
  color: string;
  design: "minimal" | "qr";
  customImage?: string | null;
}

export function CardPreview3D({ material, color, design, customImage }: CardPreview3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Tilt State
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  
  // Flip State
  const [isFlipped, setIsFlipped] = useState(false);

  // --- MUSHANTERING (Tilt) ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Normalisera musposition (-0.5 till 0.5)
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;

    // Applicera rotation
    setRotate({ x: -yPct * 15, y: xPct * 15 });
    
    // Flytta glare/ljuseffekten
    setGlare({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      opacity: 1
    });
  };

  const handleReset = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  // --- FÄRGHANTERING ---
  const getBaseColor = () => {
    if (color.startsWith("#")) return color;
    const legacyColors: Record<string, string> = {
      "black": "#1a1a1a", "white": "#f5f5f5", "red": "#dc2626",
      "blue": "#2563eb", "green": "#16a34a", "yellow": "#ca8a04", "grey": "#4b5563",
      "metal-black": "linear-gradient(135deg, #27272a 0%, #09090b 100%)",
      "silver": "linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)",
      "gold": "linear-gradient(135deg, #fcd34d 0%, #b45309 100%)",
      "rosegold": "linear-gradient(135deg, #fca5a5 0%, #9f1239 100%)",
    };
    return legacyColors[color] || "#1a1a1a";
  };

  const getBackgroundStyle = (isFront: boolean) => {
    const baseColor = getBaseColor();
    // Bild ENDAST på framsidan och ENDAST om metal
    if (isFront && customImage && material === "metal") {
       return { backgroundImage: `url(${customImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: baseColor };
  };

  const isLightColor = ["white", "silver", "gold", "yellow", "#ffffff", "#f5f5f5", "#e5e7eb", "#fcd34d"].includes(color.toLowerCase());
  const textColor = isLightColor ? "text-black" : "text-white";
  const isMetal = material === "metal";

  // Gemensam stil för rundade hörn och skuggor
  const cardStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '1rem', // rounded-2xl
    overflow: 'hidden',
    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
    position: 'relative'
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="perspective-1000 w-full flex items-center justify-center py-4 select-none">
        
        {/* SIZE CONTAINER (Behåller storleken du gillar) */}
        <div className="relative w-[85%] md:w-[90%] max-w-[600px] aspect-[1.586/1]">
          
          {/* TILT CONTAINER (Hanterar mus-effekten) */}
          <div
            ref={ref}
            onMouseMove={handleMouseMove} onMouseLeave={handleReset}
            className="w-full h-full transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing"
            style={{
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* FLIP CONTAINER (Biblioteket) */}
            <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" containerStyle={{ width: '100%', height: '100%' }}>
                
                {/* --- FRAMSIDA --- */}
                <div style={{ ...cardStyle, ...getBackgroundStyle(true) }}>
                    <OverlayEffects isMetal={isMetal} glare={glare} />
                    
                    <div className={`relative z-10 w-full h-full p-6 md:p-10 flex flex-col justify-between ${textColor}`}>
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            {customImage && material !== "metal" ? (
                                <div className="w-12 h-12 relative rounded overflow-hidden"></div>
                            ) : (
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-current opacity-20 flex items-center justify-center">
                                    <Layers size={24} className="opacity-70 md:w-8 md:h-8" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 opacity-60">
                                <Wifi className="w-5 h-5 md:w-6 md:h-6 rotate-90" />
                                <span className="text-xs font-mono tracking-widest uppercase">NFC</span>
                            </div>
                        </div>

                        {/* Footer / Namn */}
                        <div className="flex items-end justify-between">
                            {!customImage || material !== "metal" ? (
                                <div>
                                    <div className="text-2xl md:text-4xl font-bold tracking-wide">Ditt Namn</div>
                                    <div className="text-xs md:text-sm opacity-70 mt-2 uppercase tracking-wider">AvyraCards {material}</div>
                                </div>
                            ) : (
                                <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium text-white border border-white/10">
                                    Custom Design
                                </div>
                            )}

                            {design === "qr" && (
                                <div className="bg-white p-1.5 md:p-2 rounded-xl shadow-sm">
                                    <QrCode size={32} className="text-black md:w-10 md:h-10" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- BAKSIDA (Ren färg) --- */}
                <div style={{ ...cardStyle, ...getBackgroundStyle(false) }}>
                    <OverlayEffects isMetal={isMetal} glare={glare} />
                    
                    {/* Helt rent innehåll, bara en subtil ikon i mitten */}
                    <div className={`relative z-10 w-full h-full flex items-center justify-center opacity-30 ${textColor}`}>
                        <Wifi className="w-16 h-16 rotate-90" />
                    </div>
                </div>

            </ReactCardFlip>
          </div>
        </div>
      </div>

      {/* KNAPP */}
      <button 
        onClick={() => setIsFlipped(!isFlipped)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full text-sm font-medium transition-colors text-gray-300"
      >
        <RotateCw size={18} className={`transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`} />
        Vänd kortet
      </button>
    </div>
  );
}

// --- HJÄLP: EFFEKTER ---
function OverlayEffects({ isMetal, glare }: any) {
  return (
    <>
      {isMetal && (
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-30 mix-blend-overlay pointer-events-none" />
      )}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-overlay z-20"
        style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 50%)`,
            opacity: glare.opacity,
            transition: 'opacity 0.1s ease'
        }}
      />
      <div className="absolute inset-0 ring-1 ring-white/10 pointer-events-none z-30" />
    </>
  );
}