"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, X, ZoomIn } from "lucide-react";
import { useT } from "@/i18n/client";

/** Metallkortets tryckpanel i mm (samma som i card-preview-3d). */
export const PRINT_PANEL_ASPECT = 82 / 51;

export interface PrintCropState {
  crop: { x: number; y: number };
  zoom: number;
}

interface PrintImageCropperProps {
  /** Originalbilden (object URL). */
  imageSrc: string;
  /** Senast valda placering, så att "Justera" öppnar där man var. */
  initial?: PrintCropState | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (area: Area, state: PrintCropState) => void;
}

/**
 * Placera egen bild på metallkortets tryckyta (82 × 51 mm). Tidigare
 * centrerades bilden automatiskt med `cover` — kunden kunde inte välja vilken
 * del som hamnade på kortet (feedback: Simon, okt 2026).
 */
export function PrintImageCropper({ imageSrc, initial, busy = false, onCancel, onConfirm }: PrintImageCropperProps) {
  const t = useT();
  const [crop, setCrop] = useState(initial?.crop ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initial?.zoom ?? 1);
  const [area, setArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-primary/90 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t("order.cropTitle")}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-nordic-highlight/40 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-nordic-highlight/40 px-4 py-3">
          <h3 className="text-sm font-semibold text-nordic-secondary">{t("order.cropTitle")}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("common.close")}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-nordic-highlight hover:bg-slate-800 hover:text-nordic-secondary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[280px] w-full bg-nordic-primary">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            aspect={PRINT_PANEL_ASPECT}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid
            style={{ cropAreaStyle: { borderRadius: "4%" } }}
          />
        </div>

        <div className="space-y-4 p-4">
          <p className="text-xs text-nordic-highlight">{t("order.cropHint")}</p>
          <div className="flex items-center gap-2">
            <ZoomIn size={14} className="text-nordic-highlight" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={4}
              step={0.05}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-slate-300 hover:text-nordic-secondary"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => area && onConfirm(area, { crop, zoom })}
              disabled={busy || !area}
              className="flex min-h-[44px] items-center gap-2 rounded-lg bg-nordic-secondary px-5 text-sm font-bold text-nordic-primary hover:bg-nordic-support disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {t("order.cropConfirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
