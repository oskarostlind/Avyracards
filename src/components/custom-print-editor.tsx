"use client";

import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { createCroppedImage, type CroppedAreaPixels } from "@/lib/crop-image";

const CARD_ASPECT = 85.6 / 54;
const CARD_WIDTH_PX = 856;
const CARD_HEIGHT_PX = 540;

export interface CustomPrintEditorRef {
  getExportBlob: () => Promise<Blob>;
}

interface CustomPrintEditorProps {
  imageUrl: string;
  onCropped?: () => void;
}

function loadImageAsPromise(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export const CustomPrintEditor = forwardRef<CustomPrintEditorRef, CustomPrintEditorProps>(
  function CustomPrintEditor({ imageUrl, onCropped }, ref) {
    const [phase, setPhase] = useState<"crop" | "place">("crop");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [croppedAspect, setCroppedAspect] = useState(1);
    const [placeX, setPlaceX] = useState(0.2);
    const [placeY, setPlaceY] = useState(0.2);
    const [placeScale, setPlaceScale] = useState(0.5);
    const dragStart = useRef<{ x: number; y: number; startPlaceX: number; startPlaceY: number } | null>(null);

    const onCropComplete = useCallback((_croppedArea: Area, pixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(pixels);
    }, []);

    const handleCropDone = useCallback(async () => {
      if (!croppedAreaPixels) return;
      try {
        const blob = await createCroppedImage(imageUrl, croppedAreaPixels);
        const url = URL.createObjectURL(blob);
        setCroppedImageUrl(url);
        setCroppedAspect(croppedAreaPixels.width / croppedAreaPixels.height);
        setPhase("place");
        onCropped?.();
      } catch (e) {
        console.error("Crop failed", e);
      }
    }, [imageUrl, croppedAreaPixels, onCropped]);

    const handlePlacePointerDown = useCallback(
      (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          startPlaceX: placeX,
          startPlaceY: placeY,
        };
      },
      [placeX, placeY]
    );

    const handlePlacePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!dragStart.current) return;
        const dx = (e.clientX - dragStart.current.x) / 400;
        const dy = (e.clientY - dragStart.current.y) / 400;
        setPlaceX(Math.max(0, Math.min(1, dragStart.current.startPlaceX + dx)));
        setPlaceY(Math.max(0, Math.min(1, dragStart.current.startPlaceY + dy)));
      },
      []
    );

    const handlePlacePointerUp = useCallback(() => {
      dragStart.current = null;
    }, []);

    const getExportBlob = useCallback(async (): Promise<Blob> => {
      if (phase !== "place" || !croppedImageUrl) {
        throw new Error("Slutför först beskärning och placering av logotypen.");
      }
      const img = await loadImageAsPromise(croppedImageUrl);
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH_PX;
      canvas.height = CARD_HEIGHT_PX;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2d not available");
      ctx.clearRect(0, 0, CARD_WIDTH_PX, CARD_HEIGHT_PX);
      const logoW = CARD_WIDTH_PX * placeScale;
      const logoH = (img.naturalHeight / img.naturalWidth) * logoW;
      const x = Math.max(0, Math.min(CARD_WIDTH_PX - logoW, placeX * CARD_WIDTH_PX));
      const y = Math.max(0, Math.min(CARD_HEIGHT_PX - logoH, placeY * CARD_HEIGHT_PX));
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, logoW, logoH);
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
          "image/png"
        );
      });
    }, [phase, croppedImageUrl, placeX, placeY, placeScale]);

    useImperativeHandle(ref, () => ({ getExportBlob }), [getExportBlob]);

    if (phase === "crop") {
      return (
        <div className="space-y-4">
          <div className="relative h-[280px] w-full rounded-xl overflow-hidden bg-slate-900">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <p className="text-xs text-nordic-highlight">Beskär logotypen och klicka sedan på Fortsätt.</p>
          <button
            type="button"
            onClick={handleCropDone}
            disabled={!croppedAreaPixels}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm disabled:opacity-50"
          >
            Fortsätt till placering
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-xs text-nordic-highlight">Flytta logotypen och justera storleken. Denna yta motsvarar kortets proportioner.</p>
        <div
          className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden border border-white/20 bg-slate-900/50"
          style={{ aspectRatio: CARD_ASPECT }}
        >
          {croppedImageUrl && (
            <div
              className="absolute cursor-move touch-none"
              style={{
                left: `${placeX * 100}%`,
                top: `${placeY * 100}%`,
                width: `${placeScale * 100}%`,
                aspectRatio: String(croppedAspect),
              }}
              onPointerDown={handlePlacePointerDown}
              onPointerMove={handlePlacePointerMove}
              onPointerUp={handlePlacePointerUp}
              onPointerLeave={handlePlacePointerUp}
            >
              <img
                src={croppedImageUrl}
                alt="Logotyp"
                className="pointer-events-none w-full h-full object-contain"
                draggable={false}
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs text-nordic-highlight block">Storlek</label>
          <input
            type="range"
            min={0.15}
            max={0.95}
            step={0.05}
            value={placeScale}
            onChange={(e) => setPlaceScale(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-blue-500"
          />
        </div>
      </div>
    );
  }
);
