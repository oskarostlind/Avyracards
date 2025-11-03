"use client";

import { useRef, useState } from "react";

interface FileUploadButtonProps {
  onUpload: (file: File) => Promise<void>;
  label?: string;
}

export function FileUploadButton({ onUpload, label = "Ladda upp bild" }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => inputRef.current?.click();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(file);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {isUploading ? "Laddar upp..." : label}
      </button>
    </div>
  );
}
