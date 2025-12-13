"use client";

import { useRef, useState } from "react";
import { Layers, QrCode, Wifi } from "lucide-react";

interface CardPreview3DProps {
  material: "plastic" | "metal";
  color: string;
  design: "minimal" | "qr";
  customImage?: string | null;
}

export function CardPreview3D({ material, color, design, customImage }: CardPreview3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  // Hantera musrörelser (Desktop)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    updateRotation(e.clientX, e.clientY);
  };

  // Hantera touch (Mobil)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    // Förhindra scroll medan man roterar kortet
    // e.preventDefault(); 
    const touch = e.touches[0];
    updateRotation(touch.clientX, touch.clientY);
  };

  const updateRotation = (clientX: number, clientY: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    setRotate({
      x: -yPct * 20, // Minskad rotation något för mer realism
      y: xPct * 20
    });

    setGlare({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 1
    });
  };

  const handleReset = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  const getBackgroundStyle = () => {
    if (customImage && material === "metal") {
      return { backgroundImage: `url(${customImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }

    const colors: Record<string, string> = {
      "black": "#1a1a1a",
      "white": "#f5f5f5",
      "red": "#dc2626",
      "blue": "#2563eb",
      "green": "#16a34a",
      "yellow": "#ca8a04",
      "grey": "#4b5563",
      
      "metal-black": "linear-gradient(135deg, #27272a 0%, #09090b 100%)",
      "silver": "linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)",
      "gold": "linear-gradient(135deg, #fcd34d 0%, #b45309 100%)",
      "rosegold": "linear-gradient(135deg, #fca5a5 0%, #9f1239 100%)",
    };

    const bg = colors[color] || colors["black"];
    return { background: bg };
  };

  const textColor = (color === "white" || color === "silver" || color === "gold" || color === "yellow") ? "text-black" : "text-white";
  const isMetal = material === "metal";

  return (
    <div className="perspective-1000 w-full flex items-center justify-center py-4 md:py-10 select-none">
      {/* Container för proportionerna - ISO 7810 ID-1 standard ratio */}
      <div 
        className="relative w-full max-w-[340px] md:max-w-md aspect-[1.586/1]"
      >
        <div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleReset}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleReset}
          className="relative w-full h-full rounded-2xl transition-transform duration-100 ease-out transform-style-3d cursor-grab active:cursor-grabbing will-change-transform"
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            ...getBackgroundStyle(),
            // Simulerar tjocklek och skugga
            boxShadow: `
                ${-rotate.y * 1.5}px ${rotate.x * 1.5}px 2px 1px rgba(0,0,0,0.2), 
                ${-rotate.y * 3}px ${rotate.x * 3}px 15px 5px rgba(0,0,0,0.4)
            `,
          }}
        >
          {/* Metal texture overlay */}
          {isMetal && (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-30 mix-blend-overlay rounded-2xl pointer-events-none" />
          )}

          {/* Glare effect */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay z-20"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 50%)`,
              opacity: glare.opacity,
              transition: 'opacity 0.3s ease'
            }}
          />
          
          {/* Edge Highlight (Simulerar ljus på kanten) */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 pointer-events-none z-30" />

          {/* CONTENT */}
          <div className={`relative z-10 w-full h-full p-5 md:p-8 flex flex-col justify-between ${textColor}`}>
            <div className="flex justify-between items-start">
              {customImage && material !== "metal" ? (
                  <div className="w-12 h-12 relative rounded overflow-hidden">
                     {/* Visa logga här om plastkort + custom image */}
                  </div>
              ) : (
                  <div className="w-10 h-10 rounded-lg bg-current opacity-20 flex items-center justify-center">
                      <Layers size={20} className="opacity-70" />
                  </div>
              )}
              
              <div className="flex items-center gap-2 opacity-60">
                  <Wifi className="w-4 h-4 rotate-90" />
                  <span className="text-[10px] font-mono tracking-widest uppercase">NFC</span>
              </div>
            </div>

            <div className="flex items-end justify-between">
              {!customImage || material !== "metal" ? (
                  <div>
                      <div className="text-lg md:text-2xl font-bold tracking-wide">Ditt Namn</div>
                      <div className="text-[10px] md:text-xs opacity-70 mt-1 uppercase tracking-wider">SocialCard {material}</div>
                  </div>
              ) : (
                /* Om metal + custom image visas inget namn text, bara bilden som bakgrund */
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium text-white border border-white/10">
                    Custom Design
                </div>
              )}

              {design === "qr" && (
                <div className="bg-white p-1 rounded-lg shadow-sm">
                  <QrCode size={28} className="text-black" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}