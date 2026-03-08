"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Upload, X, Loader2, Image as ImageIcon, ZoomIn } from "lucide-react";
import { getCroppedImg } from "@/lib/crop-image";

type AvatarUploaderProps = {
  value?: string | null;
  onChange: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  label?: string;
};

export function AvatarUploader({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  label = "Profilbild",
}: AvatarUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // När användaren väljer en fil från datorn
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFilename(file.name);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedFile(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Spara och ladda upp till Vercel Blob
  const handleSave = async () => {
    if (!selectedFile || !croppedAreaPixels) return;

    try {
      setUploading(true);
      onUploadStart?.();

      // 1. Skapa en "ren" bild (blob) från crop-koordinaterna
      const croppedBlob = await getCroppedImg(selectedFile, croppedAreaPixels);

      // 2. Ladda upp till vårt API
      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: "POST",
        body: croppedBlob,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const newBlob = await response.json();

      // 3. Skicka tillbaka den nya URL:en (från Vercel) till formuläret
      onChange(newBlob.url);
      
      // Stäng modalen
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to upload image", error);
      alert("Kunde inte ladda upp bilden. Försök igen.");
    } finally {
      setUploading(false);
      onUploadEnd?.();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-200">
        {label}
      </label>

      <div className="flex items-center gap-4">
        {/* Visa nuvarande bild */}
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-nordic-highlight/40 bg-slate-800">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Avatar"
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
            <span>Välj ny bild</span>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
          <p className="mt-2 text-[10px] text-nordic-highlight">
            JPG, PNG eller GIF. Max 4MB.
          </p>
        </div>
      </div>

      {/* CROP MODAL (Visas bara när en fil är vald) */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-primary/90 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-nordic-highlight/40 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-nordic-highlight/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-nordic-secondary">Justera bild</h3>
              <button
                onClick={() => setSelectedFile(null)}
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
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-300 hover:text-nordic-secondary"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-nordic-secondary hover:bg-purple-500 disabled:opacity-50"
                >
                  {uploading && <Loader2 size={14} className="animate-spin" />}
                  {uploading ? "Sparar..." : "Spara bild"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}