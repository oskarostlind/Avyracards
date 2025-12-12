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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    setRotate({
      x: -yPct * 25, 
      y: xPct * 25
    });

    setGlare({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  const getBackgroundStyle = () => {
    if (customImage && material === "metal") {
      return { backgroundImage: `url(${customImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }

    const colors: Record<string, string> = {
      "black": "linear-gradient(to bottom right, #1a1a1a, #0a0a0a)",
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
    <div className="perspective-1000 w-full max-w-md mx-auto aspect-[1.586/1] flex items-center justify-center py-10">
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-full rounded-2xl shadow-2xl transition-transform duration-100 ease-out transform-style-3d cursor-grab active:cursor-grabbing"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          ...getBackgroundStyle(),
        }}
      >
        {isMetal && (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-30 mix-blend-overlay rounded-2xl pointer-events-none" />
        )}

        <div 
            className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-soft-light z-20"
            style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
                opacity: glare.opacity,
                transition: 'opacity 0.3s ease'
            }}
        />

        <div className={`relative z-10 w-full h-full p-6 md:p-8 flex flex-col justify-between ${textColor}`}>
          <div className="flex justify-between items-start">
            {customImage ? (
                <div />
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
            {!customImage ? (
                <div>
                    <div className="text-xl md:text-2xl font-bold tracking-wide">Ditt Namn</div>
                    <div className="text-xs opacity-70 mt-1 uppercase tracking-wider">SocialCard {material}</div>
                </div>
            ) : (
                <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                    Custom Print
                </div>
            )}

            {design === "qr" && (
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <QrCode size={32} className="text-black" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div 
        className="absolute bottom-0 w-[80%] h-4 bg-black/20 blur-xl rounded-[100%] transition-all duration-100"
        style={{
            transform: `translateX(${-rotate.y * 2}px) scale(${1 - Math.abs(rotate.x)/90})`
        }}
      />
    </div>
  );
}