"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    // WebGL kan saknas: avstängd hårdvaruacceleration, kraschad GPU-process
    // eller för många öppna WebGL-kontexter. Då returnerar getContext null och
    // cobe kastar "Cannot read properties of null (reading 'enable')" i sin
    // konstruktor — vilket kraschade HELA analytics-sidan med "Application
    // error". Testa på en lös canvas först (så att vi inte låser attributen på
    // den riktiga) och göm globen i stället för att dö.
    const probe = document.createElement("canvas");
    const gl =
      probe.getContext("webgl") || probe.getContext("experimental-webgl");
    if (!gl) {
      setSupported(false);
      return;
    }

    let globe: ReturnType<typeof createGlobe> | null = null;

    try {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: 600 * 2,
        height: 600 * 2,
        phi: 0,
        theta: 0,
        dark: 1, // 1 för dark mode
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [0.1, 0.8, 1], // Cyan-färgade prickar
        glowColor: [0.1, 0.1, 0.2],
        markers: [
          // Här kan vi mata in riktiga koordinater senare!
          // { location: [59.3293, 18.0686], size: 0.03 }, // Stockholm
        ],
        onRender: (state) => {
          // Rotation
          state.phi = phi;
          phi += 0.003;
        },
      });
    } catch {
      // Bältet och hängslen: även om proben lyckades kan cobe misslyckas
      // (t.ex. kontext-limit nådd exakt här). Globen är ren dekoration —
      // statistiken ska alltid visas.
      setSupported(false);
      return;
    }

    return () => {
      globe?.destroy();
    };
  }, []);

  if (!supported) return null;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
        className="opacity-80 transition-opacity duration-500 hover:opacity-100"
      />
    </div>
  );
}
