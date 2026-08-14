"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Upload, X, Loader2, Image as ImageIcon, ZoomIn } from "lucide-react";
import { getCroppedImg } from "@/lib/crop-image";
import { useT } from "@/i18n/client";
import type { Translator } from "@/i18n";

type AvatarUploaderProps = {
  value?: string | null;
  onChange: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  label?: string;
};

const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SUPPORTED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

function validateImageFile(file: File, t: Translator) {
  const hasSupportedType = SUPPORTED_IMAGE_TYPES.includes(file.type);
  const hasSupportedExtension = SUPPORTED_IMAGE_EXTENSIONS.test(file.name);

  if (!hasSupportedType && !hasSupportedExtension) {
    return t("avatarUploader.unsupportedType");
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return t("avatarUploader.tooLarge");
  }

  return null;
}

function getAvatarFilename(fileName: string) {
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${baseName || "avatar"}-${Date.now()}.jpg`;
}

async function getUploadErrorMessage(response: Response, t: Translator) {
  if (response.status === 401) {
    return t("avatarUploader.loggedOut");
  }

  const fallback = t("avatarUploader.uploadFailed");

  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return typeof data?.error === "string" ? data.error : fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export function AvatarUploader({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  label,
}: AvatarUploaderProps) {
  const t = useT();
  const resolvedLabel = label ?? t("avatarUploader.label");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const clearSelectedFile = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setSelectedFile(null);
    setFilename("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // När användaren väljer en fil från datorn
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validationError = validateImageFile(file, t);

      if (validationError) {
        clearSelectedFile();
        setError(validationError);
        e.target.value = "";
        return;
      }

      setError(null);
      setFilename(getAvatarFilename(file.name));

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setSelectedFile(objectUrl);
    }
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Spara och ladda upp till Vercel Blob
  const handleSave = async () => {
    if (!selectedFile || !croppedAreaPixels) {
      setError(t("avatarUploader.waitForLoad"));
      return;
    }

    try {
      setUploading(true);
      setError(null);
      onUploadStart?.();

      // 1. Skapa en "ren" bild (blob) från crop-koordinaterna
      const croppedBlob = await getCroppedImg(selectedFile, croppedAreaPixels);

      // 2. Ladda upp till vårt API
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        headers: { "Content-Type": croppedBlob.type || "image/jpeg" },
        body: croppedBlob,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getUploadErrorMessage(response, t));
      }

      const newBlob = await response.json();

      if (typeof newBlob?.url !== "string") {
        throw new Error(t("avatarUploader.noUrlReturned"));
      }

      // 3. Skicka tillbaka den nya URL:en (från Vercel) till formuläret
      onChange(newBlob.url);
      
      // Stäng modalen
      clearSelectedFile();
    } catch (error) {
      console.error("Failed to upload image", error);
      const message = error instanceof Error && error.message
        ? error.message
        : t("avatarUploader.uploadFailed");
      setError(message);
      alert(message);
    } finally {
      setUploading(false);
      onUploadEnd?.();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-200">
        {resolvedLabel}
      </label>

      <div className="flex items-center gap-4">
        {/* Visa nuvarande bild */}
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-nordic-highlight/40 bg-slate-800">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={t("avatarUploader.altAvatar")}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-nordic-highlight">
              <ImageIcon size={24} />
            </div>
          )}
        </div>

        {/* Uppladdningsknapp */}
        <div>
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-nordic-highlight/40 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-nordic-secondary transition-colors">
            <Upload size={14} />
            <span>{t("avatarUploader.chooseImage")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-[10px] text-nordic-highlight">
            {t("avatarUploader.formatsHint")}
          </p>
          {error && (
            <p className="mt-2 max-w-xs text-[11px] text-red-300" aria-live="polite">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* CROP MODAL (Visas bara när en fil är vald) */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-primary/90 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-nordic-highlight/40 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-nordic-highlight/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-nordic-secondary">{t("avatarUploader.adjustImage")}</h3>
              <button
                onClick={clearSelectedFile}
                className="rounded-full p-1 text-nordic-highlight hover:bg-slate-800 hover:text-nordic-secondary"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cropper Area */}
            <div className="relative h-[300px] w-full bg-nordic-primary">
              <Cropper
                image={selectedFile}
                crop={crop}
                zoom={zoom}
                aspect={1} // Kvadratisk crop för profilbilder
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={false}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-2">
                <ZoomIn size={14} className="text-nordic-highlight" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={clearSelectedFile}
                  disabled={uploading}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-300 hover:text-nordic-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-nordic-secondary hover:bg-purple-500 disabled:opacity-50"
                >
                  {uploading && <Loader2 size={14} className="animate-spin" />}
                  {uploading ? t("common.saving") : t("avatarUploader.saveImage")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}