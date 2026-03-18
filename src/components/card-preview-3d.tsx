"use client";

import NextImage from "next/image";
import ReactCardFlip from "react-card-flip";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type CSSProperties,
} from "react";
import Cropper, { type Area } from "react-easy-crop";
import { createCroppedImage, type CroppedAreaPixels } from "@/lib/crop-image";

const CARD_ASPECT = 85.6 / 54;
const CARD_WIDTH_PX = 856;
const CARD_HEIGHT_PX = 540;

const LOGO_URL = "/avyra_transparent_v2.jpg";

// Metalls tryckyta (enligt backend): 82x51mm
// Vi simulerar en otryckt metalram i UI genom att göra cropper+exportens "tryckyta"
// till ett inner-alternativ (som lämnar en transparent kant i exported PNG).
const METAL_PRINT_WIDTH_MM = 82;
const METAL_PRINT_HEIGHT_MM = 51;
const METAL_PRINT_ASPECT = METAL_PRINT_WIDTH_MM / METAL_PRINT_HEIGHT_MM;

// Konverterat till canvas-px (856x540) så att inner tryckyta matchar backend.
const METAL_INNER_WIDTH_PX = (METAL_PRINT_WIDTH_MM / 85.6) * CARD_WIDTH_PX; // 82 / 85.6
const METAL_INNER_HEIGHT_PX = (METAL_PRINT_HEIGHT_MM / 54) * CARD_HEIGHT_PX; // 51 / 54

const METAL_INSET_X_PX = (CARD_WIDTH_PX - METAL_INNER_WIDTH_PX) / 2;
const METAL_INSET_Y_PX = (CARD_HEIGHT_PX - METAL_INNER_HEIGHT_PX) / 2;

export interface CardPreview3DRef {
  getExportBlob: () => Promise<Blob>;
}

interface CardPreview3DProps {
  material: "plastic" | "metal";
  color: string;
  design: "minimal" | "qr";
  customImage?: string | null;
}

export const CardPreview3D = forwardRef<CardPreview3DRef, CardPreview3DProps>(
  function CardPreview3D({ material, color, customImage }: CardPreview3DProps, ref) {
    const isMetal = material === "metal";
    const [isFlipped, setIsFlipped] = useState(false);

    // Resize-safe edge colors for UI
    const edgeColor = useMemo((): string => {
      if (color.startsWith("#")) return color;
      const legacy: Record<string, string> = {
        "metal-black": "#27272a",
        silver: "#e5e7eb",
        gold: "#fcd34d",
        rosegold: "#fca5a5",
      };
      return legacy[color] || "#27272a";
    }, [color]);

    const baseBackground = useMemo((): string => {
      if (color.startsWith("#")) return color;
      const legacy: Record<string, string> = {
        "metal-black": "linear-gradient(135deg, #27272a 0%, #09090b 100%)",
        silver: "linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)",
        gold: "linear-gradient(135deg, #fcd34d 0%, #b45309 100%)",
        rosegold: "linear-gradient(135deg, #fca5a5 0%, #9f1239 100%)",
        black: "#1a1a1a",
        white: "#f5f5f5",
      };
      return legacy[color] || "#1a1a1a";
    }, [color]);

    // react-easy-crop state (metal custom print only)
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1.5);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

    const prevImageRef = useRef<string | null>(null);
    useEffect(() => {
      if (!customImage) {
        prevImageRef.current = null;
        setCrop({ x: 0, y: 0 });
        setZoom(1.5);
        setCroppedAreaPixels(null);
        return;
      }
      if (prevImageRef.current !== customImage) {
        prevImageRef.current = customImage;
        setCrop({ x: 0, y: 0 });
        setZoom(1.5);
        setCroppedAreaPixels(null);
      }
    }, [customImage]);

    const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
      setCroppedAreaPixels({
        x: pixels.x,
        y: pixels.y,
        width: pixels.width,
        height: pixels.height,
      });
    }, []);

    const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
      });
    }, []);

    const drawLogo = useCallback(
      async (ctx: CanvasRenderingContext2D): Promise<void> => {
        const logoImg = await loadImage(LOGO_URL);
        const naturalW = logoImg.naturalWidth;
        const naturalH = logoImg.naturalHeight;
        if (naturalW <= 0 || naturalH <= 0) return;

        if (!isMetal) {
          const maxW = CARD_WIDTH_PX * 0.92;
          const maxH = CARD_HEIGHT_PX * 0.92;
          const scale = Math.min(maxW / naturalW, maxH / naturalH);
          const logoW = naturalW * scale;
          const logoH = naturalH * scale;
          const x = (CARD_WIDTH_PX - logoW) / 2;
          const y = (CARD_HEIGHT_PX - logoH) / 2;
          ctx.drawImage(logoImg, x, y, logoW, logoH);
          return;
        }

        // Metal: liten logo i vänster hörn (innanför metalramen)
        const maxW = CARD_WIDTH_PX * 0.36;
        const maxH = CARD_HEIGHT_PX * 0.26;
        const scale = Math.min(maxW / naturalW, maxH / naturalH);
        const logoW = naturalW * scale;
        const logoH = naturalH * scale;

        // Flush i hörnet (inner tryckyta), så den ligger "på kanten" visuellt.
        const x = METAL_INSET_X_PX;
        const y = METAL_INSET_Y_PX;
        ctx.drawImage(logoImg, x, y, logoW, logoH);
      },
      [isMetal, loadImage]
    );

    const getExportBlob = useCallback(async (): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH_PX;
      canvas.height = CARD_HEIGHT_PX;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2d not available");

      ctx.clearRect(0, 0, CARD_WIDTH_PX, CARD_HEIGHT_PX);

      // 1) Kundens custom image (under loggan)
      if (isMetal && customImage) {
        if (!croppedAreaPixels) {
          throw new Error("Zooma och placera bilden på kortet innan du går vidare.");
        }
        const blob = await createCroppedImage(customImage, croppedAreaPixels);
        const url = URL.createObjectURL(blob);
        try {
          const img = await loadImage(url);
          const drawW = CARD_WIDTH_PX - 2 * METAL_INSET_X_PX;
          const drawH = CARD_HEIGHT_PX - 2 * METAL_INSET_Y_PX;
          ctx.drawImage(
            img,
            METAL_INSET_X_PX,
            METAL_INSET_Y_PX,
            drawW,
            drawH
          );
        } finally {
          URL.revokeObjectURL(url);
        }
      }

      // 2) Logga ovanpå (alltid)
      await drawLogo(ctx);

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/png"
        );
      });
    }, [customImage, croppedAreaPixels, drawLogo, isMetal, loadImage]);

    useImperativeHandle(ref, () => ({ getExportBlob }), [getExportBlob]);

    const metalCropperStyle = useMemo((): CSSProperties => {
      const insetXPercent = (METAL_INSET_X_PX / CARD_WIDTH_PX) * 100;
      const insetYPercent = (METAL_INSET_Y_PX / CARD_HEIGHT_PX) * 100;
      return {
        left: `${insetXPercent}%`,
        right: `${insetXPercent}%`,
        top: `${insetYPercent}%`,
        bottom: `${insetYPercent}%`,
      };
    }, []);

    const showCropper = isMetal && !!customImage;

    const cardFaceStyle: CSSProperties = useMemo(
      () => ({
        background: baseBackground,
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.3)",
        position: "relative",
      }),
      [baseBackground]
    );

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="perspective-1000 w-full flex items-center justify-center py-4 select-none">
          <div
            className="relative w-[85%] md:w-[90%] max-w-[600px]"
            style={{ aspectRatio: String(CARD_ASPECT) }}
          >
            <ReactCardFlip
              isFlipped={isFlipped}
              flipDirection="horizontal"
              containerStyle={{ width: "100%", height: "100%" }}
            >
              {/* --- FRONT (visar logo + custom print) --- */}
              <div
                className="w-full h-full rounded-2xl overflow-hidden"
                style={cardFaceStyle}
              >
                {isMetal && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      boxShadow: `inset 0 0 0 2px ${edgeColor}`,
                      borderRadius: "1rem",
                    }}
                  />
                )}

                {/* Kundens bild under loggan */}
                <div className="absolute inset-0 z-20">
                  {showCropper && (
                    <div
                      className="absolute z-20"
                      style={{
                        position: "absolute",
                        ...metalCropperStyle,
                      }}
                    >
                      <Cropper
                        image={customImage ?? undefined}
                        crop={crop}
                        zoom={zoom}
                        aspect={METAL_PRINT_ASPECT}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        showGrid={false}
                        objectFit="cover"
                        cropShape="rect"
                        restrictPosition={false}
                        minZoom={0.2}
                        maxZoom={8}
                        style={{
                          cropAreaStyle: {
                            border: "none",
                            boxShadow: "none",
                            color: "transparent",
                          },
                        }}
                        classes={{
                          cropAreaClassName: "",
                        }}
                      />
                    </div>
                  )}

                  {/* Logga ovanpå (alltid) */}
                  <div className="absolute inset-0 pointer-events-none z-30">
                    {!isMetal ? (
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[92%]">
                        <NextImage
                          src={LOGO_URL}
                          alt="Avyra logo"
                          fill
                          style={{ objectFit: "contain" }}
                          priority
                        />
                      </div>
                    ) : (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                        left: `${(METAL_INSET_X_PX / CARD_WIDTH_PX) * 100}%`,
                        top: `${(METAL_INSET_Y_PX / CARD_HEIGHT_PX) * 100}%`,
                          width: `${(CARD_WIDTH_PX * 0.36 / CARD_WIDTH_PX) * 100}%`,
                          height: `${(CARD_HEIGHT_PX * 0.26 / CARD_HEIGHT_PX) * 100}%`,
                        }}
                      >
                        <NextImage
                          src={LOGO_URL}
                          alt="Avyra logo"
                          fill
                          style={{ objectFit: "contain" }}
                          priority
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- BACK (blank) --- */}
              <div
                className="w-full h-full rounded-2xl overflow-hidden"
                style={cardFaceStyle}
              >
                {isMetal && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      boxShadow: `inset 0 0 0 2px ${edgeColor}`,
                      borderRadius: "1rem",
                    }}
                  />
                )}
              </div>
            </ReactCardFlip>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFlipped((v) => !v)}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full text-sm font-medium transition-colors text-gray-300"
        >
          Vänd kortet
        </button>
      </div>
    );
  }
);