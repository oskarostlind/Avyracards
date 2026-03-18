"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface DownloadPrintPdfButtonProps {
  cardId: string;
  className?: string;
}

export function DownloadPrintPdfButton({ cardId, className }: DownloadPrintPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cards/${cardId}/generate-pdf`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Kunde inte ladda ner");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tryckfil.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Kunde inte ladda ner tryckfilen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition disabled:opacity-50"
      }
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Download size={12} />
      )}
      {loading ? "Laddar..." : "Ladda ner Tryckfil"}
    </button>
  );
}
