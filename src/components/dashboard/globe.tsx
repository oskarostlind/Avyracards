"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
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

    return () => {
      globe.destroy();
    };
  }, []);

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